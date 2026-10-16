/**
 * 生成 Schema.org JSON-LD 块（站点级 + 文章级），供 unhead 的 script.innerHTML 注入。
 *
 * 参考：https://schema.org/BlogPosting · https://schema.org/Person · https://schema.org/WebSite
 * GEO 友好要点：datePublished/dateModified/author/publisher/image/mainEntityOfPage 必填，
 * keywords/inLanguage/articleSection 强烈建议。
 *
 * 写法约束：Schema.org `@context` / `@type` / `@id` / `@graph` 等带 `@` 的键必须引号包裹，
 * 为保持一致（quote-props rule），其余键也统一加引号。
 */
import type { PostFrontmatter } from '~/types/post-frontmatter'

const SITE_URL = 'https://imba97.com'
const SITE_NAME = 'imba97 Blog'
const AUTHOR_NAME = 'imba97'
const AUTHOR_EMAIL = 'mailto:mail@imba97.cn'
const AUTHOR_GITHUB = 'https://github.com/imba97'
const AUTHOR_LINK = 'https://imba97.com/about'
const PUBLISHER_LOGO = `${SITE_URL}/assets/images/favicon.png`
const DEFAULT_LANG = 'zh-CN'

interface JsonLdNode {
  '@context': 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

function toAbsoluteUrl(value: string | undefined | null): string | undefined {
  if (!value)
    return undefined
  const trimmed = value.trim()
  if (!trimmed)
    return undefined
  if (/^https?:\/\//i.test(trimmed))
    return trimmed
  if (trimmed.startsWith('//'))
    return `https:${trimmed}`
  return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, SITE_URL).toString()
}

function safeString(value: unknown): string {
  if (value == null)
    return ''
  if (value instanceof Date)
    return value.toISOString()
  return String(value).trim()
}

function pickString(value: unknown): string | undefined {
  const s = safeString(value)
  return s || undefined
}

/** 站点级 JSON-LD：Person + WebSite，作为 `@graph` 注入到所有页面 head */
export function buildSiteJsonLd(): JsonLdNode {
  const person: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    'name': AUTHOR_NAME,
    'url': AUTHOR_LINK,
    'email': AUTHOR_EMAIL,
    'image': PUBLISHER_LOGO,
    'sameAs': [
      AUTHOR_GITHUB
      // 后续如有多平台身份（Twitter / Mastodon 等）追加到此处
    ]
  }

  const webSite: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': SITE_NAME,
    'url': SITE_URL,
    'inLanguage': DEFAULT_LANG,
    'publisher': { '@id': `${SITE_URL}/#person` },
    'author': { '@id': `${SITE_URL}/#person` }
  }

  // 用 @graph 让 Person 与 WebSite 共用同一个 @id 引用，避免模型解析时孤立
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        ...person,
        '@id': `${SITE_URL}/#person`
      },
      webSite
    ]
  }
}

interface BlogPostingInput {
  path: string
  frontmatter: PostFrontmatter | undefined
  defaultImage?: string
}

function parseDate(value: unknown): string | undefined {
  if (value == null || value === '')
    return undefined
  if (value instanceof Date)
    return value.toISOString()
  const raw = safeString(value)
  if (!raw)
    return undefined
  const ts = Date.parse(raw.includes('T') || /[+-]\d{2}:?\d{2}$|Z$/i.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`)
  if (Number.isNaN(ts))
    return undefined
  return new Date(ts).toISOString()
}

/** 文章页 JSON-LD：BlogPosting，带 author/publisher/datePublished/dateModified/image */
export function buildBlogPostingJsonLd(input: BlogPostingInput): JsonLdNode | null {
  const fm = input.frontmatter
  if (!fm)
    return null

  const title = pickString(fm.title)
  const description = pickString(fm.description)
  const datePublished = parseDate(fm.date) ?? parseDate(fm.updated)
  const dateModified = parseDate(fm.updated) ?? datePublished
  const imageInput = pickString(fm.image) ?? input.defaultImage
  const image = toAbsoluteUrl(imageInput)
  const path = input.path && input.path !== '/' ? input.path : '/'
  const url = toAbsoluteUrl(path) ?? SITE_URL

  const tagsRaw = Array.isArray(fm.tags)
    ? fm.tags
    : typeof fm.tags === 'string'
      ? fm.tags.split(',')
      : []
  const keywords = tagsRaw.map(t => safeString(t)).filter(Boolean)

  const node: JsonLdNode = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': url
    },
    'url': url,
    'headline': title,
    'description': description,
    'datePublished': datePublished,
    'dateModified': dateModified,
    'inLanguage': DEFAULT_LANG,
    'author': {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      'name': AUTHOR_NAME,
      'url': AUTHOR_LINK
    },
    'publisher': {
      '@type': 'Organization',
      'name': SITE_NAME,
      'url': SITE_URL,
      'logo': {
        '@type': 'ImageObject',
        'url': PUBLISHER_LOGO
      }
    },
    'image': image
  }

  if (keywords.length > 0)
    node.keywords = keywords.join(', ')

  return node
}
