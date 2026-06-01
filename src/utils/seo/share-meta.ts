import { getCurrentFavicon } from '../seasonal-avatar'

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
}

function getStringField(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function createShareMeta(input: ShareMetaInput) {
  const title = getStringField(input.frontmatter?.title) || SITE_NAME
  const description = getStringField(input.frontmatter?.description) || SITE_NAME
  const image = getStringField(input.frontmatter?.image) || getCurrentFavicon()
  const absoluteImage = toAbsoluteSiteUrl(image)
  const pagePath = input.path || '/'
  const ogType = /^\/post\/\d+$/.test(pagePath) ? 'article' : 'website'

  return {
    title,
    meta: [
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
  }
}
