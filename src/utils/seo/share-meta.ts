import type { SeoFaqItem } from '~/types/seo'
import { siteSeo } from '../../../.auto-generate/site-seo'
import { DEFAULT_FAVICON } from '../seasonal-avatar'
import {
  buildBlogPostingJsonLd,
  buildFaqJsonLd,
  serializeJsonLd,
  toAbsoluteUrl,
  toIsoDateString
} from './json-ld'

const SITE_NAME = siteSeo.name
const SITE_TITLE = siteSeo.title ?? siteSeo.name
const SITE_DESCRIPTION = siteSeo.description

/** 路由 meta 上的 GEO 字段（由 scripts/vite/route-frontmatter.ts 写入） */
export interface SeoRouteMeta {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  faq?: SeoFaqItem[]
  date?: string
  updated?: string
  tags?: string[]
  categories?: string[]
}

export interface ShareMetaInput {
  path: string
  seo?: SeoRouteMeta
  defaultImage?: string
}

interface MetaTag {
  name?: string
  property?: string
  content: string
}

interface LinkTag {
  rel: string
  href: string
  type?: string
  title?: string
}

function getString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function charLength(value: string): number {
  return [...value].length
}

/**
 * 标题按 30–60 字符铺平：
 * - 太短的页面标题补 ` · imba97 Blog`
 * - 已经够长的文章标题保持原样，不再叠后缀
 */
function buildTitle(pageTitle: string | undefined, fallback: string): string {
  const clean = pageTitle?.trim() ?? ''
  if (!clean)
    return fallback
  if (charLength(clean) >= 30)
    return clean
  const withSuffix = `${clean} · ${SITE_NAME}`
  return charLength(withSuffix) <= 60 ? withSuffix : clean
}

function normalizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value))
    return []
  return value.map(item => getString(item)).filter(Boolean)
}

export function createShareMeta(input: ShareMetaInput) {
  const seo = input.seo
  const pageTitle = getString(seo?.title)
  const title = buildTitle(pageTitle, SITE_TITLE)
  const description = getString(seo?.description) || SITE_DESCRIPTION
  const keywords = normalizeKeywords(seo?.keywords)
  const pagePath = input.path || '/'
  const canonical = toAbsoluteUrl(pagePath) ?? siteSeo.url
  const isArticle = /^\/post\/\d+$/.test(pagePath)
  const image = toAbsoluteUrl(getString(seo?.image) || getString(input.defaultImage) || DEFAULT_FAVICON) ?? DEFAULT_FAVICON
  const imageAlt = pageTitle || SITE_NAME
  const publishedAt = toIsoDateString(seo?.date)
  const modifiedAt = toIsoDateString(seo?.updated) ?? publishedAt
  const tags = (seo?.tags ?? []).map(tag => getString(tag)).filter(Boolean)
  const section = getString(seo?.categories?.[0])

  const meta: MetaTag[] = [
    { name: 'description', content: description },
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:image:alt', content: imageAlt },
    { property: 'og:type', content: isArticle ? 'article' : 'website' },
    { property: 'og:url', content: canonical },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: 'zh_CN' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: imageAlt }
  ]

  if (keywords.length > 0)
    meta.splice(1, 0, { name: 'keywords', content: keywords.join(', ') })

  if (isArticle) {
    if (publishedAt)
      meta.push({ property: 'article:published_time', content: publishedAt })
    if (modifiedAt)
      meta.push({ property: 'article:modified_time', content: modifiedAt })
    if (section)
      meta.push({ property: 'article:section', content: section })
    for (const tag of tags)
      meta.push({ property: 'article:tag', content: tag })
    meta.push({ property: 'article:author', content: siteSeo.author.name })
  }

  const link: LinkTag[] = [
    { rel: 'canonical', href: canonical },
    // 机器可读的站点清单：AI 一次拿到全站入口，不用爬全站
    { rel: 'alternate', type: 'application/json', href: `${siteSeo.url}/summary.json`, title: `${SITE_NAME} 站点摘要` }
  ]

  // 文章页追加 markdown 直出版本链接，让 LLM / RAG 优先抓取结构化正文而非渲染后的 HTML。
  if (isArticle) {
    const mdUrl = `${canonical.replace(/\/+$/, '')}.md`
    link.push({ rel: 'alternate', type: 'text/markdown', href: mdUrl })
  }

  const script: { type: 'application/ld+json', innerHTML: string }[] = []

  if (isArticle) {
    const jsonLd = buildBlogPostingJsonLd({
      path: pagePath,
      title: pageTitle,
      description,
      date: seo?.date,
      updated: seo?.updated,
      tags,
      categories: seo?.categories,
      image: seo?.image,
      keywords,
      defaultImage: input.defaultImage
    })
    if (jsonLd)
      script.push({ type: 'application/ld+json', innerHTML: serializeJsonLd(jsonLd) })
  }

  if (seo?.faq && seo.faq.length > 0) {
    const faqJsonLd = buildFaqJsonLd({ path: pagePath, items: seo.faq, name: pageTitle || undefined })
    if (faqJsonLd)
      script.push({ type: 'application/ld+json', innerHTML: serializeJsonLd(faqJsonLd) })
  }

  return { title, meta, link, script }
}
