import { readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { extractPostImage } from './extract-post-image'

export const SITE_URL = 'https://imba97.com'
export const SITE_NAME = 'imba97 Blog'
export const DEFAULT_OG_IMAGE = '/assets/images/favicon.png'

export interface ShareMetaTag {
  name?: string
  property?: string
  content: string
}

export interface ShareMetaPayload {
  title: string
  description: string
  absoluteImage: string
  pagePath: string
  ogType: 'article' | 'website'
}

export function normalizeModuleIdToFilePath(moduleId: string): string {
  return path.normalize(moduleId.split('?')[0] ?? moduleId)
}

export function toAbsoluteSiteUrl(input: string): string {
  if (/^https?:\/\//i.test(input))
    return input
  if (input.startsWith('//'))
    return `https:${input}`
  const normalized = input.startsWith('/') ? input : `/${input}`
  return new URL(normalized, SITE_URL).toString()
}

export function extractImageFromMarkdownFile(filePath: string, frontmatter: Record<string, unknown>): string | null {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const { content } = matter(raw)
    return extractPostImage(frontmatter, content)
  }
  catch {
    return null
  }
}

export function mergeFrontmatterFromMarkdownFile(
  filePath: string,
  frontmatter: Record<string, unknown>
): Record<string, unknown> {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const { data } = matter(raw)
    return {
      ...(data as Record<string, unknown>),
      ...frontmatter
    }
  }
  catch {
    return frontmatter
  }
}

export function upsertMetaTag(meta: ShareMetaTag[], tag: ShareMetaTag): void {
  const key = tag.property
    ? `property:${tag.property}`
    : tag.name
      ? `name:${tag.name}`
      : null
  if (!key)
    return

  const index = meta.findIndex((item) => {
    if (tag.property)
      return item.property === tag.property
    if (tag.name)
      return item.name === tag.name
    return false
  })

  if (index >= 0)
    meta[index] = tag
  else
    meta.push(tag)
}

export function mergeShareMeta(meta: ShareMetaTag[], payload: ShareMetaPayload): ShareMetaTag[] {
  const merged = [...meta]

  upsertMetaTag(merged, { name: 'description', content: payload.description })
  upsertMetaTag(merged, { property: 'og:title', content: payload.title })
  upsertMetaTag(merged, { property: 'og:description', content: payload.description })
  upsertMetaTag(merged, { property: 'og:image', content: payload.absoluteImage })
  upsertMetaTag(merged, { property: 'og:type', content: payload.ogType })
  upsertMetaTag(merged, { property: 'og:url', content: toAbsoluteSiteUrl(payload.pagePath) })
  upsertMetaTag(merged, { property: 'og:site_name', content: SITE_NAME })
  upsertMetaTag(merged, { name: 'twitter:card', content: 'summary_large_image' })
  upsertMetaTag(merged, { name: 'twitter:title', content: payload.title })
  upsertMetaTag(merged, { name: 'twitter:description', content: payload.description })
  upsertMetaTag(merged, { name: 'twitter:image', content: payload.absoluteImage })

  return merged
}
