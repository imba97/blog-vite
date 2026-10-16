import type { PostFrontmatter } from '~/types/post-frontmatter'
import { DEFAULT_FAVICON } from '../seasonal-avatar'
import { buildBlogPostingJsonLd } from './json-ld'

const SITE_NAME = 'imba97 Blog'
const SITE_URL = 'https://imba97.com'

function toAbsoluteSiteUrl(input: string): string {
  if (/^https?:\/\//i.test(input))
    return input
  if (input.startsWith('//'))
    return `https:${input}`
  const normalized = input.startsWith('/') ? input : `/${input}`
  return new URL(normalized, SITE_URL).toString()
}

export interface ShareMetaInput {
  path: string
  frontmatter?: Record<string, unknown>
  defaultImage?: string
}

function getStringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function createShareMeta(input: ShareMetaInput) {
  const title = getStringField(input.frontmatter?.title) || SITE_NAME
  const description = getStringField(input.frontmatter?.description) || SITE_NAME
  const defaultImage = getStringField(input.defaultImage) || DEFAULT_FAVICON
  const image = getStringField(input.frontmatter?.image) || defaultImage
  const absoluteImage = toAbsoluteSiteUrl(image)
  const pagePath = input.path || '/'
  const ogType = /^\/post\/\d+$/.test(pagePath) ? 'article' : 'website'

  const meta = [
    { name: 'description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: absoluteImage },
    { property: 'og:type', content: ogType },
    { property: 'og:url', content: toAbsoluteSiteUrl(pagePath) },
    { property: 'og:site_name', content: SITE_NAME },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: absoluteImage }
  ]

  // 文章页：追加 canonical 与 markdown 直出版本链接，
  // 让 LLM / RAG 优先抓取结构化正文而非渲染后的 HTML。
  const link: { rel: string, href?: string, type?: string }[] = []
  if (ogType === 'article') {
    const absoluteUrl = toAbsoluteSiteUrl(pagePath)
    link.push({ rel: 'canonical', href: absoluteUrl })
    const mdUrl = `${absoluteUrl.replace(/\/+$/, '')}.md`
    link.push({ rel: 'alternate', type: 'text/markdown', href: mdUrl })
  }

  // 文章页：注入 JSON-LD BlogPosting（站点级 JSON-LD 由 App.vue 注入 Person + WebSite）
  const script: { type: 'application/ld+json', innerHTML: string }[] = []
  if (ogType === 'article') {
    const jsonLd = buildBlogPostingJsonLd({
      path: pagePath,
      frontmatter: input.frontmatter as PostFrontmatter | undefined,
      defaultImage: input.defaultImage
    })
    if (jsonLd) {
      script.push({
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd)
      })
    }
  }

  return {
    title,
    meta,
    link,
    script
  }
}
