import path from 'node:path'
import process from 'node:process'

/**
 * 搜索 wasm 构建配置。全部可用环境变量覆盖，便于在 Netlify / 本地 / CI 用同一份脚本。
 */
export interface SearchWasmConfig {
  /** 源码仓库（默认 GitHub，可用 SSH 或带 token 的 https） */
  repo: string
  /** 分支 / tag / 提交号 */
  ref: string
  /** 私有仓库时的访问 token（会被注入 clone URL 并自动打码） */
  token: string | null
  /** 本地已 clone 的目录；设置后跳过 clone（离线开发 / 单仓库联调） */
  localDir: string | null
  /** clone 缓存目录，位于 node_modules/.cache 下，Netlify 会自然丢弃 */
  cacheDir: string
  /** 产物落地目录（相对仓库根），随 Vite 拷进 dist */
  wasmDir: string
  /** 文章目录（直读输入） */
  postsDir: string
  /** 已有的全文索引 JSON（MiniSearch 回退路径用），同时是对拍基准 */
  fullIndexFile: string
  /** 生成物根目录（已 gitignore） */
  generatedDir: string
  /** 构建失败时是否降级继续（默认 1：站点照常发布，搜索回退 MiniSearch） */
  optional: boolean
  /** 完全跳过本步骤 */
  skip: boolean
  /** cargo 走离线模式（本地无网 / 走代理时用） */
  cargoOffline: boolean
  /** 缺少 wasm-pack 时自动安装（官方脚本，只下载预编译二进制） */
  installWasmPack: boolean
  /** 缺少 cargo 时自动安装 Rust 工具链（Netlify 镜像若不带 Rust 时打开） */
  bootstrapToolchain: boolean
  verbose: boolean
}

function envFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw === '')
    return fallback
  return !['0', 'false', 'no', 'off'].includes(raw.trim().toLowerCase())
}

const root = process.cwd()

export function resolveConfig(): SearchWasmConfig {
  return {
    repo: process.env.SEARCH_WASM_REPO || 'https://github.com/imba97/bigseek.git',
    ref: process.env.SEARCH_WASM_REF || 'main',
    token: process.env.SEARCH_WASM_TOKEN || null,
    localDir: process.env.SEARCH_WASM_LOCAL_DIR ? path.resolve(process.env.SEARCH_WASM_LOCAL_DIR) : null,
    cacheDir: path.join(root, 'node_modules', '.cache', 'bigseek', 'src'),
    wasmDir: path.join(root, 'public', 'search'),
    postsDir: path.join(root, 'posts'),
    fullIndexFile: path.join(root, 'public', 'search-full.json'),
    generatedDir: path.join(root, '.auto-generate', 'search-wasm'),
    optional: envFlag('SEARCH_WASM_OPTIONAL', true),
    skip: envFlag('SEARCH_WASM_SKIP', false),
    cargoOffline: envFlag('SEARCH_WASM_CARGO_OFFLINE', false),
    installWasmPack: envFlag('SEARCH_WASM_INSTALL_WASM_PACK', true),
    bootstrapToolchain: envFlag('SEARCH_WASM_BOOTSTRAP', false),
    verbose: envFlag('SEARCH_WASM_VERBOSE', false)
  }
}
