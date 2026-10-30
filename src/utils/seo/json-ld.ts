/**
 * 生成 Schema.org JSON-LD 块（站点级 + 文章级 + FAQ），供 unhead 的 script.innerHTML 注入。
 *
 * 参考：https://schema.org/Organization · https://schema.org/BlogPosting · https://schema.org/FAQPage
 * GEO 友好要点：datePublished/dateModified/author/publisher/image/mainEntityOfPage 必填，
 * keywords/inLanguage/articleSection/about/citation 强烈建议；品牌与联系方式挂在 Organization 上。
 *
 * 写法约束：Schema.org `@context` / `@type` / `@id` / `@graph` 等带 `@` 的键必须引号包裹，
 * 为保持一致（quote-props rule），其余键也统一加引号。
 */
import type { SeoFaqItem } from '~/types/seo'
import { siteSeo } from '../../../.auto-generate/site-seo'

const SITE_URL = siteSeo.url
const SITE_NAME = siteSeo.name
const ORGANIZATION_ID = `${SITE_URL}/#organization`
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`
const DEFAULT_LANG = 'zh-CN'
const PUBLISHER_LOGO = `${SITE_URL}/assets/images/favicon.png`

interface JsonLdNode {
  '@context'?: 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

export function toAbsoluteUrl(value: string | undefined | null): string | undefined {
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

export function toIsoDateString(value: unknown): string | undefined {
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

function toNameList(value: unknown): string[] {
  if (Array.isArray(value))
    return value.map(item => safeString(item)).filter(Boolean)
  if (typeof value === 'string')
    return value.split(/[,，]/).map(item => item.trim()).filter(Boolean)
  return []
}

/**
 * JSON-LD 序列化：转义 `<`，避免正文里的 `</script>` 把标签提前闭合，
 * 导致整块结构化数据解析失败（GEO 检测里表现就是「No valid JSON-LD」）。
 */
export function serializeJsonLd(node: unknown): string {
  return JSON.stringify(node).replace(/</g, '\\u003c')
}

/** 站点级 JSON-LD：Organization + Person + WebSite，作为 `@graph` 注入到所有页面 head */
export function buildSiteJsonLd(): JsonLdNode {
  const organization: JsonLdNode = {
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    'name': SITE_NAME,
    'alternateName': siteSeo.alternateNames?.length ? siteSeo.alternateNames : undefined,
    'url': SITE_URL,
    'description': siteSeo.description,
    'logo': {
      '@type': 'ImageObject',
      'url': PUBLISHER_LOGO
    },
    'email': siteSeo.contact?.email ?? siteSeo.author.email,
    'sameAs': siteSeo.author.sameAs?.length ? siteSeo.author.sameAs : undefined,
    'knowsAbout': siteSeo.topics?.length ? siteSeo.topics : undefined,
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer support',
      'email': siteSeo.contact?.email ?? siteSeo.author.email,
      'url': siteSeo.contact?.url ?? `${SITE_URL}/about`
    }
  }

  const person: JsonLdNode = {
    '@type': 'Person',
    '@id': PERSON_ID,
    'name': siteSeo.author.name,
    'url': siteSeo.author.url ?? `${SITE_URL}/about`,
    'email': siteSeo.author.email,
    'image': PUBLISHER_LOGO,
    'worksFor': { '@id': ORGANIZATION_ID },
    'sameAs': siteSeo.author.sameAs?.length ? siteSeo.author.sameAs : undefined
  }

  const webSite: JsonLdNode = {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    'name': SITE_NAME,
    'url': SITE_URL,
    'description': siteSeo.description,
    'inLanguage': DEFAULT_LANG,
    'publisher': { '@id': ORGANIZATION_ID },
    'author': { '@id': PERSON_ID }
  }

  // 用 @graph 让三个节点共用 @id 引用，避免模型解析时各自孤立
  return {
    '@context': 'https://schema.org',
    '@graph': [organization, person, webSite]
  }
}

export interface BlogPostingInput {
  path: string
  title?: string
  description?: string
  date?: string
  updated?: string
  tags?: string[]
  categories?: string[]
  image?: string
  keywords?: string[]
  about?: string[]
  citations?: string[]
  defaultImage?: string
}

/** 文章页 JSON-LD：BlogPosting，带 author/publisher/datePublished/dateModified/image */
export function buildBlogPostingJsonLd(input: BlogPostingInput): JsonLdNode | null {
  const title = pickString(input.title)
  if (!title)
    return null

  const description = pickString(input.description)
  const datePublished = toIsoDateString(input.date) ?? toIsoDateString(input.updated)
  const dateModified = toIsoDateString(input.updated) ?? datePublished
  const image = toAbsoluteUrl(pickString(input.image) ?? input.defaultImage)
  const path = input.path && input.path !== '/' ? input.path : '/'
  const url = toAbsoluteUrl(path) ?? SITE_URL

  const tags = toNameList(input.tags)
  const categories = toNameList(input.categories)
  const keywords = (input.keywords?.length ? input.keywords : tags).filter(Boolean)
  const about = (input.about?.length ? input.about : categories)
    .filter(Boolean)
    .map(name => ({ '@type': 'Thing', 'name': name }))

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
    'isPartOf': { '@id': WEBSITE_ID },
    'author': {
      '@type': 'Person',
      '@id': PERSON_ID,
      'name': siteSeo.author.name,
      'url': siteSeo.author.url ?? `${SITE_URL}/about`
    },
    'publisher': { '@id': ORGANIZATION_ID },
    'image': image,
    'articleSection': categories[0],
    'keywords': keywords.length > 0 ? keywords.join(', ') : undefined,
    'about': about.length > 0 ? about : undefined
  }

  if (input.citations?.length) {
    node.citation = input.citations
      .map(url => toAbsoluteUrl(url))
      .filter((url): url is string => Boolean(url))
  }

  return node
}

/** FAQPage JSON-LD：站点 /faq 页与带 `faq` 的文章页共用 */
export function buildFaqJsonLd(input: {
  path: string
  items: SeoFaqItem[]
  name?: string
}): JsonLdNode | null {
  const items = input.items.filter(item => item.question.trim() && item.answer.trim())
  if (items.length === 0)
    return null

  const url = toAbsoluteUrl(input.path)

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    'url': url,
    'name': input.name ?? `${SITE_NAME} 常见问题`,
    'inLanguage': DEFAULT_LANG,
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question.trim(),
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer.trim()
      }
    }))
  }
}
