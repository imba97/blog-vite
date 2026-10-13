/**
 * 检索结果类型直接转发 `bigseek` 的定义，避免两边字段漂移。
 */
export type { SearchHit } from 'bigseek'

/** `search-meta.json` 的一条记录：只有元信息，用于标签/分类联想 */
export interface SearchMetaRecord {
  id: string
  path: string
  title: string
  date: string
  tags: string[]
  categories: string[]
}
