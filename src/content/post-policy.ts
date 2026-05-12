import type { PostFrontmatter } from '../types/post-frontmatter'
import { postPublicPath } from '../constants/route-policy'

export function normalizeNumericPostId(data: Record<string, unknown>): string | null {
  if (data.id == null || data.id === '')
    return null
  const idStr = String(data.id).trim()
  if (!/^\d+$/.test(idStr))
    return null
  return idStr
}

export function normalizeStringList(value: unknown): string[] {
  if (value == null)
    return []
  if (Array.isArray(value))
    return value.map(v => String(v).trim()).filter(Boolean)
  return [String(value).trim()].filter(Boolean)
}

export function formatPostDateString(value: unknown): string {
  if (value == null)
    return ''
  if (typeof value === 'string')
    return value
  if (value instanceof Date)
    return value.toISOString()
  return String(value)
}

/**
 * 与列表、搜索索引、RSS 对齐：非 draft、有 date、数字 id。
 */
export function isPublishablePostData(data: unknown): boolean {
  if (!data || typeof data !== 'object')
    return false
  const o = data as Record<string, unknown>
  if (o.draft)
    return false
  if (o.date == null || o.date === '')
    return false
  return normalizeNumericPostId(o) != null
}

export function publishablePostPublicPath(data: unknown): string | null {
  if (!isPublishablePostData(data))
    return null
  const id = normalizeNumericPostId(data as Record<string, unknown>)
  return id ? postPublicPath(id) : null
}

export interface PostListEntry {
  path: string
  title: string
  date: string
  tags: string[]
  categories: string[]
}

export function toPostListEntry(data: PostFrontmatter, path: string): PostListEntry {
  return {
    path,
    title: String(data.title ?? ''),
    date: formatPostDateString(data.date),
    tags: normalizeStringList(data.tags),
    categories: normalizeStringList(data.categories)
  }
}

export function sortPostListEntriesByDateDesc<T extends { date: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => +new Date(b.date) - +new Date(a.date))
}
