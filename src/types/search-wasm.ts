/**
 * `bigseek` wasm-bindgen 产物（`--target web`）在博客侧的类型描述。
 *
 * glue 文件是从 `public/search/bigseek.js` 运行时动态 import 的，
 * Vite 不参与打包，所以这里手工声明形状；字段与 `src/wasm.rs` 一一对应。
 */

export interface WasmSearchHit {
  path: string
  title: string
  date: string
  tags: string[]
  categories: string[]
  snippet: string
  score: number
  exact: boolean
}

export interface WasmSearchIndex {
  /** tag / category 传 null 或省略表示不限定范围；limit 传 null 用默认值 40 */
  query: (
    keywords: string,
    tag?: string | null,
    category?: string | null,
    limit?: number | null
  ) => WasmSearchHit[]
  docCount: () => number
  termCount: () => number
  formatVersion: () => number
  /** [标签数, 分类数] */
  facetCounts: () => number[]
}

export interface WasmSearchModule {
  /** wasm-bindgen 的 `--target web` 初始化函数；显式传字节可绕开 MIME 与路径问题 */
  default: (input: { module_or_path: BufferSource }) => Promise<unknown>
  SearchIndex: new (bytes: Uint8Array) => WasmSearchIndex
}
