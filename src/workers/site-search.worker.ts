import { createMiniSearchFallback, serveSearch } from 'bigseek'

/**
 * 站内搜索 Worker 入口。
 *
 * 引擎加载、查询、回退、latest-wins 对账这些逻辑都在 `bigseek` 包里，
 * 这里只负责本站特有的两件事：拼产物地址、把构建期环境变量翻译成包的选项。
 */

const base = import.meta.env.BASE_URL || '/'

/**
 * `auto`（默认）：先试 wasm，失败回退 MiniSearch
 * `wasm`：强制 wasm，失败即报错
 * `minisearch`：强制回退引擎（排查用）
 */
function resolveEngine(): 'auto' | 'wasm' | 'minisearch' {
  const raw = String(import.meta.env.VITE_SEARCH_ENGINE || 'auto').trim().toLowerCase()
  return raw === 'wasm' || raw === 'minisearch' ? raw : 'auto'
}

serveSearch({
  wasm: {
    glueUrl: `${base}search/bigseek.js`,
    wasmUrl: `${base}search/bigseek_bg.wasm`,
    indexUrl: `${base}search/search.idx`
  },
  // wasm 产物缺失或加载失败时，用构建期产出的 JSON 语料继续提供搜索
  fallback: () => createMiniSearchFallback({ source: `${base}search-full.json` }),
  engine: resolveEngine(),
  log: (message, ...args) => {
    if (import.meta.env.DEV)
      console.warn(message, ...args)
  }
})
