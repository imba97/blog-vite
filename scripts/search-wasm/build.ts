import type { SearchWasmConfig } from './config.ts'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateSearchIndex } from '../generate-search-index.ts'
import { resolveConfig } from './config.ts'
import { runParityCheck } from './parity.ts'
import { runPostPolicyParity } from './post-policy-parity.ts'

/**
 * 搜索 wasm 的构建入口：拿到 bigseek 的产物 → 生成索引 → 自检 → 放进 `public/search/`。
 *
 * 产物来源有两种（见 `resolveWasmSource`）：
 *
 * - **release**（默认）：从 GitHub Release 下载 `bigseek_bg.wasm` + `bigseek.js` +
 *   `build-index-linux-x64`（原生索引生成器）+ 两份契约向量。构建端**不需要 Rust 工具链**。
 *   只有「正式 tag + linux x64」走这条；分支 / commit / 其它平台自动退回源码编译。
 * - **source**：clone 源码，`cargo build` 出 build-index、`wasm-pack build` 出 wasm 包。
 *
 * 落地四件套：
 * - `bigseek_bg.wasm`  检索内核（release 下载或本地编译）
 * - `bigseek.js`       wasm-bindgen glue，Worker 里用运行时动态 import 加载
 * - `search.idx`       build-index 直读 `posts/` 产出的紧凑索引（含正文，供摘要使用）
 * - `manifest.json`    记录产物来源 / ref / commit / 体积 / hash，排查线上问题用
 *
 * 设计原则：
 * 1. **原子落地**：先全部构建到 staging 目录，最后一次性拷贝；中途失败则清掉 `public/search/`，
 *    让运行期干净地回退 MiniSearch，而不是拿到半套产物。
 * 2. **可降级**：默认 `SEARCH_WASM_OPTIONAL=1`，任何一步失败都只警告不阻断站点发布。
 * 3. **自检前置**：分词向量对拍 + 发布规则对拍 + `build-index --verify` 召回自检 +
 *    双路径索引哈希门禁，全都过了才落地。
 */

const root = process.cwd()

function log(message: string): void {
  console.log(`[search-wasm] ${message}`)
}

function warn(message: string): void {
  console.warn(`[search-wasm] ${message}`)
}

interface RunOptions {
  cwd?: string
  capture?: boolean
  /** capture 模式下是否把子进程输出转发到本进程日志（解析用输出可关掉，避免刷屏） */
  echo?: boolean
  secrets?: string[]
}

function run(command: string, args: string[], options: RunOptions = {}): string {
  const shown = args.map(arg =>
    (options.secrets ?? []).some(secret => secret && arg.includes(secret)) ? '***REDACTED***' : arg
  )
  log(`$ ${command} ${shown.join(' ')}`)

  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit'
  })

  if (result.error)
    throw new Error(`${command} 启动失败：${result.error.message}`)
  if (result.status !== 0)
    throw new Error(`${command} 退出码 ${result.status}`)

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (options.capture && options.echo !== false && output.trim())
    process.stdout.write(output)
  return output
}

/** 在 PATH 与 CARGO_HOME/bin 里找可执行文件 */
/** 在 PATH 与 CARGO_HOME/bin 里找可执行文件；找不到返回 null（由调用方决定报错还是降级） */
function resolveBinary(name: string): string | null {
  const probe = spawnSync(name, ['--version'], { stdio: 'ignore' })
  if (!probe.error && probe.status === 0)
    return name

  const home = process.env.HOME || process.env.USERPROFILE || ''
  const cargoHome = process.env.CARGO_HOME || path.join(home, '.cargo')
  const candidate = path.join(cargoHome, 'bin', process.platform === 'win32' ? `${name}.exe` : name)
  return existsSync(candidate) ? candidate : null
}

/**
 * Netlify 之类的构建镜像基本不会自带 wasm-pack，缺了就必然静默回退——那这套东西等于白做。
 * 官方安装脚本只下载预编译二进制，几秒钟，所以默认允许自动安装。
 */
function ensureWasmPack(cfg: SearchWasmConfig): string {
  const existing = resolveBinary('wasm-pack')
  if (existing)
    return existing

  if (!cfg.installWasmPack)
    throw new Error('找不到 wasm-pack。安装：https://rustwasm.github.io/wasm-pack/installer/')

  log('未找到 wasm-pack，用官方脚本安装（仅下载预编译二进制）')
  if (process.platform === 'win32') {
    run('powershell', [
      '-NoProfile',
      '-Command',
      'iwr https://rustwasm.github.io/wasm-pack/installer/init.ps1 -UseBasicParsing | iex'
    ])
  }
  else {
    run('sh', ['-c', 'curl -sSf https://rustwasm.github.io/wasm-pack/installer/init.sh | sh'])
  }

  const installed = resolveBinary('wasm-pack')
  if (!installed)
    throw new Error('wasm-pack 安装脚本执行完仍找不到可执行文件（可能不在 PATH，检查 $HOME/.cargo/bin）')
  return installed
}

/** 确保 cargo 可用（只有 `source` 模式需要） */
function ensureCargo(cfg: SearchWasmConfig): string {
  let cargo = resolveBinary('cargo')

  if (!cargo) {
    if (!cfg.bootstrapToolchain) {
      throw new Error(
        '找不到 cargo。本机/镜像需要 Rust；或在环境里设置 SEARCH_WASM_BOOTSTRAP=1 让本脚本自动安装 rustup'
      )
    }
    log('未找到 cargo，安装 Rust 工具链（rustup，minimal profile）')
    run('sh', [
      '-c',
      'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain stable'
    ])
    cargo = resolveBinary('cargo')
    if (!cargo)
      throw new Error('rustup 安装完成仍找不到 cargo，检查 $HOME/.cargo/bin 是否在 PATH')
  }

  return cargo
}

/** 确保 wasm32-unknown-unknown 目标已安装（只有 `source` 模式跑 wasm-pack 才需要） */
function ensureWasmTarget(): void {
  const rustup = resolveBinary('rustup')
  if (!rustup)
    return

  const installed = run(rustup, ['target', 'list', '--installed'], { capture: true, echo: false })
  if (!installed.includes('wasm32-unknown-unknown')) {
    log('安装 wasm32-unknown-unknown 目标')
    run(rustup, ['target', 'add', 'wasm32-unknown-unknown'])
  }
}

/** 带 token 的 clone / fetch URL（私有仓库用；日志里自动打码） */
function repoUrl(cfg: SearchWasmConfig): string {
  return cfg.token ? cfg.repo.replace(/^https:\/\//, `https://x-access-token:${cfg.token}@`) : cfg.repo
}

/**
 * 解析实际使用的 ref。
 *
 * `latest`（默认）会在构建时查一次远端 tag，取版本号最大的**正式版**（形如 `vX.Y.Z`）。
 * 这样发版之后不需要改任何配置，同时也不会把主干上未发布的提交带进生产。
 * 预发布（`v0.2.0-rc.1`）与其它命名不会被自动选中，需要显式写 `SEARCH_WASM_REF`。
 *
 * 顺带把 tag 对应的 commit 带出来，供 `manifest.json` 记录（release 模式没有本地 clone，`git rev-parse` 用不了）。
 */
function resolveRef(cfg: SearchWasmConfig): { ref: string, sha?: string } {
  if (cfg.ref !== 'latest')
    return { ref: cfg.ref }

  const output = run('git', ['ls-remote', '--tags', '--refs', '--sort=-v:refname', repoUrl(cfg), 'v*'], {
    capture: true,
    echo: false,
    secrets: cfg.token ? [cfg.token] : []
  })

  const tags = output
    .split('\n')
    .map((line) => {
      const [sha = '', ref = ''] = line.trim().split(/\s+/)
      return { sha, tag: ref.replace('refs/tags/', '') }
    })
    .filter(entry => /^v\d+\.\d+\.\d+$/.test(entry.tag))

  if (tags.length === 0)
    throw new Error(`在 ${cfg.repo} 上没找到形如 vX.Y.Z 的正式 tag；请用 SEARCH_WASM_REF 显式指定版本`)

  log(`latest → ${tags[0].tag}（远端现有 ${tags.length} 个正式 tag，最近的：${tags.slice(0, 3).map(t => t.tag).join(', ')}）`)
  return { ref: tags[0].tag, sha: tags[0].sha }
}

/** 拉取（或更新）搜索库源码；`SEARCH_WASM_LOCAL_DIR` 时直接用本地目录 */
function ensureSource(cfg: SearchWasmConfig, ref: string): string {
  if (cfg.localDir) {
    if (!existsSync(path.join(cfg.localDir, 'Cargo.toml')))
      throw new Error(`SEARCH_WASM_LOCAL_DIR=${cfg.localDir} 里没有 Cargo.toml`)
    log(`使用本地源码目录：${cfg.localDir}`)
    return cfg.localDir
  }

  const dest = cfg.cacheDir
  const url = repoUrl(cfg)
  const secrets = cfg.token ? [cfg.token] : []

  if (existsSync(path.join(dest, '.git'))) {
    log(`更新已有 clone：${dest}`)
    run('git', ['fetch', '--depth', '1', 'origin', ref], { cwd: dest, secrets })
    run('git', ['checkout', '--force', 'FETCH_HEAD'], { cwd: dest, secrets })
  }
  else {
    rmSync(dest, { recursive: true, force: true })
    mkdirSync(path.dirname(dest), { recursive: true })
    log(`clone ${cfg.repo}@${ref} → ${dest}`)
    run('git', ['clone', '--depth', '1', '--branch', ref, url, dest], { secrets })
  }
  return dest
}

/** 把仓库地址规范成可下载 release 的 HTTPS 形式（兼容 https 与 git@github.com: 两种写法） */
function httpsRepoUrl(cfg: SearchWasmConfig): string {
  let url = cfg.repo.replace(/\.git$/, '')
  if (url.startsWith('git@github.com:'))
    url = `https://github.com/${url.slice('git@github.com:'.length)}`
  if (cfg.token)
    url = url.replace(/^https:\/\//, `https://x-access-token:${cfg.token}@`)
  return url
}

/** 下载 release 附件；GitHub 会 302 跳到 CDN，Node 的 fetch 默认跟随重定向 */
async function downloadReleaseAsset(
  cfg: SearchWasmConfig,
  ref: string,
  asset: string,
  dest: string
): Promise<void> {
  const url = `${httpsRepoUrl(cfg)}/releases/download/${encodeURIComponent(ref)}/${asset}`
  log(`下载 ${cfg.token ? url.replace(cfg.token, '***') : url}`)

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(
      `下载 ${asset} 失败：HTTP ${res.status}。常见原因：release ${ref} 还没**发布**`
      + `（draft 状态的 release 不能匿名下载），或该版本的 CI 还没跑完`
    )
  }

  const bytes = new Uint8Array(await res.arrayBuffer())
  writeFileSync(dest, bytes)
  log(`  ${asset} → ${(bytes.length / 1024).toFixed(1)} KiB`)
}

/**
 * 产物来源判定。只有「显式 source」「本地目录」「非正式 tag」「非 linux x64」才回退到源码编译——
 * release 里带的 `build-index` 是为 Netlify（linux x64）编的，别的平台跑不了。
 */
function resolveWasmSource(cfg: SearchWasmConfig, ref: string): 'release' | 'source' {
  if (cfg.wasmSource === 'source')
    return 'source'
  if (cfg.localDir) {
    log('SEARCH_WASM_LOCAL_DIR 已设置 → 从本地源码编译')
    return 'source'
  }
  if (!/^v\d/.test(ref)) {
    log(`ref=${ref} 不是正式 tag（v*）→ 从源码编译`)
    return 'source'
  }
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    log(`当前平台 ${process.platform}/${process.arch} 与 release 里的 build-index 不匹配 → 从源码编译`)
    return 'source'
  }
  return 'release'
}

/** 构建端需要的一组 wasm 侧输入 */
interface PreparedWasm {
  source: 'release' | 'source'
  /** 生成 search.idx 的 native 二进制 */
  buildIndexBin: string
  glue: string
  wasm: string
  /** 跨语言契约向量（分词 / 发布规则对拍用） */
  vectors: { name: string, path: string }[]
  commit: string
}

/** 从 GitHub Release 下载全部产物——构建端不需要任何 Rust 工具链 */
async function prepareFromRelease(cfg: SearchWasmConfig, ref: string, sha?: string): Promise<PreparedWasm> {
  const dir = path.join(root, 'node_modules', '.cache', 'bigseek', 'release', ref.replace(/[^\w.-]/g, '_'))
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  const assets = [
    { asset: 'bigseek_bg.wasm', local: 'bigseek_bg.wasm' },
    { asset: 'bigseek.js', local: 'bigseek.js' },
    { asset: 'build-index-linux-x64', local: 'build-index' },
    { asset: 'tokenize-vectors.json', local: 'tokenize-vectors.json' },
    { asset: 'post-policy-vectors.json', local: 'post-policy-vectors.json' }
  ]

  for (const { asset, local } of assets)
    await downloadReleaseAsset(cfg, ref, asset, path.join(dir, local))

  // 下载下来的文件没有执行位
  chmodSync(path.join(dir, 'build-index'), 0o755)

  return {
    source: 'release',
    buildIndexBin: path.join(dir, 'build-index'),
    glue: path.join(dir, 'bigseek.js'),
    wasm: path.join(dir, 'bigseek_bg.wasm'),
    vectors: assets
      .filter(item => item.local.endsWith('-vectors.json'))
      .map(item => ({ name: item.local, path: path.join(dir, item.local) })),
    commit: sha ?? 'unknown'
  }
}

/** clone 源码自己编译（分支 / commit / 非 linux x64 / 显式 source 模式 / 本地目录） */
function prepareFromSource(cfg: SearchWasmConfig, ref: string): PreparedWasm {
  const sourceDir = ensureSource(cfg, ref)
  const cargo = ensureCargo(cfg)
  const cargoArgs = cfg.cargoOffline ? ['--offline'] : []

  run(cargo, ['build', ...cargoArgs, '--release', '--features', 'cli', '--bin', 'build-index'], { cwd: sourceDir })
  const buildIndexBin = resolveBuildIndexBin(cargo, sourceDir, cargoArgs)

  ensureWasmTarget()
  const wasmPack = ensureWasmPack(cfg)
  const pkgDir = path.join(sourceDir, 'pkg')
  rmSync(pkgDir, { recursive: true, force: true })
  // 必须 --no-default-features：默认 feature 含 cli（comrak/serde_yaml_ng/regex），
  // 不加的话那些依赖会被编进 wasm（实测多 5 KiB，构建也变慢）
  run(
    wasmPack,
    [
      'build',
      '--target',
      'web',
      '--release',
      '--out-dir',
      'pkg',
      '--no-pack',
      '--no-default-features',
      '--features',
      'wasm'
    ],
    { cwd: sourceDir }
  )

  return {
    source: 'source',
    buildIndexBin,
    glue: path.join(pkgDir, 'bigseek.js'),
    wasm: path.join(pkgDir, 'bigseek_bg.wasm'),
    vectors: ['tokenize-vectors.json', 'post-policy-vectors.json'].map(name => ({
      name,
      path: path.join(sourceDir, 'testdata', name)
    })),
    commit: gitCommit(sourceDir)
  }
}

function gitCommit(sourceDir: string): string {
  try {
    return run('git', ['rev-parse', 'HEAD'], { cwd: sourceDir, capture: true }).trim().slice(0, 12)
  }
  catch {
    return 'unknown'
  }
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16)
}

/** `cargo metadata` 拿 target 目录，避免自己猜 target/release 的位置（CI 常自定义 CARGO_TARGET_DIR） */
function resolveBuildIndexBin(cargo: string, sourceDir: string, cargoArgs: string[]): string {
  const metadata = JSON.parse(
    run(cargo, ['metadata', ...cargoArgs, '--format-version', '1', '--no-deps'], {
      cwd: sourceDir,
      capture: true,
      echo: false
    })
  ) as { target_directory: string }
  const name = process.platform === 'win32' ? 'build-index.exe' : 'build-index'
  return path.join(metadata.target_directory, 'release', name)
}

async function main(): Promise<void> {
  const cfg = resolveConfig()
  if (cfg.skip) {
    // 不删产物（可能是有意复用），但也绝不静默：陈旧索引配新内容是最难查的一类线上问题
    if (existsSync(path.join(cfg.wasmDir, 'manifest.json'))) {
      const manifest = JSON.parse(readFileSync(path.join(cfg.wasmDir, 'manifest.json'), 'utf-8')) as {
        commit?: string
        builtAt?: string
      }
      warn(`SEARCH_WASM_SKIP=1：沿用已有产物（commit ${manifest.commit ?? '?'}，构建于 ${manifest.builtAt ?? '?'}）`)
      warn('如果文章内容已更新，这份 search.idx 已经过期，请去掉 SKIP 重新构建')
    }
    else {
      log('SEARCH_WASM_SKIP=1，且没有已有产物：运行期将回退 MiniSearch')
    }
    return
  }

  // ---- 0. 清掉旧产物：任何失败都会让运行期回退 MiniSearch，而不是拿到半套文件 ----
  rmSync(cfg.wasmDir, { recursive: true, force: true })

  // ---- 1. 生成全文索引 JSON（沿用 TS 侧唯一真源）----
  log('生成 public/search-full.json')
  await generateSearchIndex('public')

  // ---- 2. 决定产物来源：正式 tag + linux x64 直接从 release 下载，其余情况 clone 源码自己编译 ----
  const { ref, sha } = resolveRef(cfg)
  const wasmSource = resolveWasmSource(cfg, ref)

  // ---- 3. 准备 wasm 侧输入（wasm 包 + build-index + 契约向量）----
  const prepared = wasmSource === 'release'
    ? await prepareFromRelease(cfg, ref, sha)
    : prepareFromSource(cfg, ref)
  log(`搜索库产物：${prepared.source} · ${ref} @ ${prepared.commit}`)

  // ---- 4. 跨语言契约对拍：分词语义 + 发布规则 ----
  mkdirSync(cfg.generatedDir, { recursive: true })
  for (const { name, path: vectorPath } of prepared.vectors) {
    if (!existsSync(vectorPath)) {
      warn(`缺少 ${name}，跳过对应的一致性校验`)
      continue
    }
    cpSync(vectorPath, path.join(cfg.generatedDir, name))

    if (name === 'tokenize-vectors.json') {
      const parity = runParityCheck(path.join(cfg.generatedDir, name))
      if (parity.failures.length > 0) {
        for (const failure of parity.failures)
          console.error(`  ${failure}`)
        throw new Error(`分词一致性校验失败：${parity.failures.length} 个用例不一致（向量版本 ${parity.version}）`)
      }
      log(`分词一致性通过：${parity.passed} 个用例（向量版本 ${parity.version}）`)
    }
    else {
      const parity = runPostPolicyParity(path.join(cfg.generatedDir, name))
      if (parity.failures.length > 0) {
        for (const failure of parity.failures)
          console.error(`  ${failure}`)
        throw new Error(`发布规则一致性校验失败：${parity.failures.length} 个用例不一致（向量版本 ${parity.version}）`)
      }
      log(`发布规则一致性通过：${parity.passed} 个用例（向量版本 ${parity.version}）`)
    }
  }

  // ---- 5. 索引：直读 posts/ 生成 + 召回自检 ----
  const staging = path.join(root, 'node_modules', '.cache', 'bigseek', 'staging')
  rmSync(staging, { recursive: true, force: true })
  mkdirSync(staging, { recursive: true })
  const stagedIndex = path.join(staging, 'search.idx')

  const indexOutput = run(
    prepared.buildIndexBin,
    ['--posts-dir', cfg.postsDir, '--output', stagedIndex, '--verify'],
    { capture: true }
  )

  const stats = /docs=(\d+)\s+terms=(\d+)/.exec(indexOutput)
  const docs = stats ? Number(stats[1]) : 0
  const terms = stats ? Number(stats[2]) : 0

  // ---- 5b. 双路径哈希门禁 ----
  // 同一次构建里，用 TS 产出的 search-full.json 再建一份索引；两份必须字节相同。
  // 一旦不同，说明「Rust 直读文章」与「TS 抽文」的规则已经漂移——那 wasm 索引和 MiniSearch
  // 回退索引收录的内容就会不一致，且线上极难发现。这里花 ~50ms 把它挡在发布前。
  const parityIndex = path.join(staging, 'parity.idx')
  run(prepared.buildIndexBin, ['--input', cfg.fullIndexFile, '--output', parityIndex, '--quiet'], {
    capture: true,
    echo: false
  })
  const directHash = sha256(stagedIndex)
  const jsonHash = sha256(parityIndex)
  if (directHash !== jsonHash) {
    throw new Error(
      [
        '直读文章与 JSON 路径产出的索引不一致（两条抽取路径已漂移）',
        `  直读 posts/          → sha256:${directHash}`,
        `  读 search-full.json  → sha256:${jsonHash}`,
        '  定位差异：cd 到搜索库后运行',
        '    cargo test --features cli --test direct_read_parity -- --nocapture',
        `    （BLOG_POSTS_DIR=${cfg.postsDir} BLOG_SEARCH_DOCS=${cfg.fullIndexFile}）`
      ].join('\n')
    )
  }
  log(`双路径索引一致：sha256:${directHash}`)

  // ---- 6. 落地 ----
  // 注：wasm 侧的 ABI 契约测试（query 返回的 JS 对象字段、tags 是否为数组、
  // 非法字节流是否抛可捕获异常）由 Rust 的 `tests/wasm_abi.rs` 覆盖，
  // 在搜索库 CI 里用 `wasm-pack test --node` 执行，博客构建里不跑 JS 测试。
  mkdirSync(cfg.wasmDir, { recursive: true })
  const artifacts: [string, string][] = [
    [prepared.glue, 'bigseek.js'],
    [prepared.wasm, 'bigseek_bg.wasm']
  ]
  for (const [from, name] of artifacts) {
    if (!existsSync(from))
      throw new Error(`缺少 wasm 产物：${from}`)
    cpSync(from, path.join(cfg.wasmDir, name))
  }
  cpSync(stagedIndex, path.join(cfg.wasmDir, 'search.idx'))

  const wasmFile = path.join(cfg.wasmDir, 'bigseek_bg.wasm')
  const indexFile = path.join(cfg.wasmDir, 'search.idx')
  const manifest = {
    source: cfg.repo,
    // release = 下载预编译产物（构建端不需要 Rust）；source = clone 源码自己编译
    wasmSource: prepared.source,
    // 记录解析后的真实 ref（`latest` 会被换成具体 tag），排查线上问题时能一眼看出用的哪个版本
    ref,
    commit: prepared.commit,
    builtAt: new Date().toISOString(),
    docs,
    terms,
    files: {
      'bigseek_bg.wasm': { bytes: readFileSync(wasmFile).length, sha256: sha256(wasmFile) },
      'search.idx': { bytes: readFileSync(indexFile).length, sha256: sha256(indexFile) },
      // 索引由哪个二进制生成：release 模式下它是下载下来的，留个哈希便于追溯
      'build-index': { sha256: sha256(prepared.buildIndexBin) }
    }
  }
  writeFileSync(path.join(cfg.wasmDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')

  log(
    `完成：wasm ${(manifest.files['bigseek_bg.wasm'].bytes / 1024).toFixed(1)} KiB / 索引 `
    + `${(manifest.files['search.idx'].bytes / 1024).toFixed(0)} KiB / ${docs} 篇 ${terms} 词条`
    + `（${prepared.source} · ${ref} @ ${prepared.commit}）`
  )
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  const cfg = resolveConfig()
  rmSync(cfg.wasmDir, { recursive: true, force: true })

  if (!cfg.optional) {
    console.error(`[search-wasm] 构建失败（SEARCH_WASM_OPTIONAL=0，直接中断）：${message}`)
    process.exit(1)
  }

  console.warn('')
  console.warn('='.repeat(78))
  console.warn(`[search-wasm] 构建失败，已清理 public/search/ —— 站点将继续发布，搜索回退 MiniSearch。`)
  console.warn(`[search-wasm] 原因：${message}`)
  console.warn(`[search-wasm] 想让它中断构建：设置 SEARCH_WASM_OPTIONAL=0`)
  console.warn('='.repeat(78))
  console.warn('')
})
