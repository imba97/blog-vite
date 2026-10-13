import type { SearchWasmConfig } from './config.ts'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateSearchIndex } from '../generate-search-index.ts'
import { resolveConfig } from './config.ts'
import { runParityCheck } from './parity.ts'
import { runPostPolicyParity } from './post-policy-parity.ts'

/**
 * 搜索 wasm 的构建入口：拉取 `bigseek`、编译、自检，把产物放进 `public/search/`。
 *
 * 产物四件套：
 * - `bigseek_bg.wasm`  wasm-pack 产物（检索内核）
 * - `bigseek.js`       wasm-bindgen glue，Worker 里用运行时动态 import 加载
 * - `search.idx`           build-index 产出的紧凑索引（含正文，供摘要使用）
 * - `manifest.json`        记录 commit / 体积 / hash，排查线上问题用
 *
 * 设计原则：
 * 1. **原子落地**：先全部构建到 staging 目录，最后一次性拷贝；中途失败则清掉 `public/search/`，
 *    让运行期干净地回退 MiniSearch，而不是拿到半套产物。
 * 2. **可降级**：默认 `SEARCH_WASM_OPTIONAL=1`，任何一步失败都只警告不阻断站点发布。
 * 3. **自检前置**：分词向量对拍 + `build-index --verify` 召回自检 + wasm 冒烟，三者都过了才落地。
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

/** 确保 cargo 可用，并保证 wasm32-unknown-unknown 目标已安装 */
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

  // wasm32 目标：有 rustup 就顺手补上，避免 wasm-pack 抛一句难懂的错
  const rustup = resolveBinary('rustup')
  if (rustup) {
    const installed = run(rustup, ['target', 'list', '--installed'], { capture: true, echo: false })
    if (!installed.includes('wasm32-unknown-unknown')) {
      log('安装 wasm32-unknown-unknown 目标')
      run(rustup, ['target', 'add', 'wasm32-unknown-unknown'])
    }
  }

  return cargo
}

/** 拉取（或更新）搜索库源码；`SEARCH_WASM_LOCAL_DIR` 时直接用本地目录 */
function ensureSource(cfg: SearchWasmConfig): string {
  if (cfg.localDir) {
    if (!existsSync(path.join(cfg.localDir, 'Cargo.toml')))
      throw new Error(`SEARCH_WASM_LOCAL_DIR=${cfg.localDir} 里没有 Cargo.toml`)
    log(`使用本地源码目录：${cfg.localDir}`)
    return cfg.localDir
  }

  const dest = cfg.cacheDir
  const url = cfg.token
    ? cfg.repo.replace(/^https:\/\//, `https://x-access-token:${cfg.token}@`)
    : cfg.repo
  const secrets = cfg.token ? [cfg.token] : []

  if (existsSync(path.join(dest, '.git'))) {
    log(`更新已有 clone：${dest}`)
    run('git', ['fetch', '--depth', '1', 'origin', cfg.ref], { cwd: dest, secrets })
    run('git', ['checkout', '--force', 'FETCH_HEAD'], { cwd: dest, secrets })
  }
  else {
    rmSync(dest, { recursive: true, force: true })
    mkdirSync(path.dirname(dest), { recursive: true })
    log(`clone ${cfg.repo}@${cfg.ref} → ${dest}`)
    run('git', ['clone', '--depth', '1', '--branch', cfg.ref, url, dest], { secrets })
  }
  return dest
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

  const cargoArgs = cfg.cargoOffline ? ['--offline'] : []

  // ---- 0. 清掉旧产物：任何失败都会让运行期回退 MiniSearch，而不是拿到半套文件 ----
  rmSync(cfg.wasmDir, { recursive: true, force: true })

  // ---- 1. 生成全文索引 JSON（沿用 TS 侧唯一真源）----
  log('生成 public/search-full.json')
  await generateSearchIndex('public')

  // ---- 2. 源码 ----
  const sourceDir = ensureSource(cfg)
  const commit = gitCommit(sourceDir)
  log(`搜索库源码 commit：${commit}`)

  // ---- 3. 工具链 ----
  const cargo = ensureCargo(cfg)
  const wasmPack = ensureWasmPack(cfg)

  // ---- 4. 跨语言契约对拍：分词语义 + 发布规则 ----
  const contractFiles = ['tokenize-vectors.json', 'post-policy-vectors.json'] as const
  mkdirSync(cfg.generatedDir, { recursive: true })
  for (const name of contractFiles) {
    const from = path.join(sourceDir, 'testdata', name)
    if (!existsSync(from)) {
      warn(`源码里没有 testdata/${name}，跳过对应的一致性校验`)
      continue
    }
    cpSync(from, path.join(cfg.generatedDir, name))

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

  // 先单独 build（stdio 直通，CI 日志里能看到实时编译进度），再直接调用二进制
  run(cargo, ['build', ...cargoArgs, '--release', '--features', 'cli', '--bin', 'build-index'], { cwd: sourceDir })
  const buildIndexBin = resolveBuildIndexBin(cargo, sourceDir, cargoArgs)

  const indexOutput = run(
    buildIndexBin,
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
  run(buildIndexBin, ['--input', cfg.fullIndexFile, '--output', parityIndex, '--quiet'], {
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

  // ---- 6. wasm ----
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

  // ---- 7. 落地 ----
  // 注：wasm 侧的 ABI 契约测试（query 返回的 JS 对象字段、tags 是否为数组、
  // 非法字节流是否抛可捕获异常）已改为 Rust 编写的 `tests/wasm_abi.rs`，
  // 由搜索库 CI 的 `wasm-pack test --node` 执行，博客构建里不再跑 JS 测试。
  mkdirSync(cfg.wasmDir, { recursive: true })
  for (const file of ['bigseek.js', 'bigseek_bg.wasm']) {
    const from = path.join(pkgDir, file)
    if (!existsSync(from))
      throw new Error(`wasm-pack 产物缺少 ${file}`)
    cpSync(from, path.join(cfg.wasmDir, file))
  }
  cpSync(stagedIndex, path.join(cfg.wasmDir, 'search.idx'))

  const wasmFile = path.join(cfg.wasmDir, 'bigseek_bg.wasm')
  const indexFile = path.join(cfg.wasmDir, 'search.idx')
  const manifest = {
    source: cfg.repo,
    ref: cfg.ref,
    commit,
    builtAt: new Date().toISOString(),
    docs,
    terms,
    files: {
      'bigseek_bg.wasm': { bytes: readFileSync(wasmFile).length, sha256: sha256(wasmFile) },
      'search.idx': { bytes: readFileSync(indexFile).length, sha256: sha256(indexFile) }
    }
  }
  writeFileSync(path.join(cfg.wasmDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')

  log(
    `完成：wasm ${(manifest.files['bigseek_bg.wasm'].bytes / 1024).toFixed(1)} KiB / 索引 `
    + `${(manifest.files['search.idx'].bytes / 1024).toFixed(0)} KiB / ${docs} 篇 ${terms} 词条（commit ${commit}）`
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
