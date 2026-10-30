import type { SeoFaqItem } from '../../src/types/seo.ts'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import matter from '@11ty/gray-matter'
import { postPublicPath } from '../../src/constants/route-policy.ts'
import { isPublishablePostData, normalizeNumericPostId, normalizeStringList } from '../../src/content/post-policy.ts'
import { extractPostImage } from '../seo/extract-post-image.ts'
import { deriveDescription, getPageSeo, resolvePostSeo } from '../seo/load-seo.ts'

interface RouteLike {
  components: Map<string, string>
  addToMeta: (meta: Record<string, unknown>) => void
  path: string
  name?: string
}

function isPostMarkdownFile(filePath: string, postsMarkdownRoot: string): boolean {
  const abs = path.normalize(filePath)
  return abs === postsMarkdownRoot || abs.startsWith(`${postsMarkdownRoot}${path.sep}`)
}

/**
 * 从文件路径推断静态页的公开路由：`pages/about/index.md` → `/about`。
 *
 * 不能用 `route.path`：extendRoute 阶段它还没算好（index 是 `/`，
 * 其余 markdown 页是空串，404 还是 `/:404(.*)` 这样的模式串），
 * 拿它去查 seo/pages.json 永远查不到。
 */
function pagePathFromFile(filePath: string): string | null {
  const pagesRoot = path.resolve(process.cwd(), 'pages')
  const rel = path.relative(pagesRoot, path.resolve(filePath))
  if (rel.startsWith('..') || path.isAbsolute(rel))
    return null

  const normalized = rel.split(path.sep).join('/')
  const withoutFile = normalized.replace(/(?:^|\/)index\.md$/, '').replace(/\.md$/, '')
  const routePath = `/${withoutFile}`.replace(/\/+$/, '')
  return routePath || '/'
}

export function applyMarkdownRouteMeta(route: RouteLike, postsMarkdownRoot: string): void {
  const defaultFile = route.components.get('default')
  if (!defaultFile || !defaultFile.endsWith('.md'))
    return

  const { data, content } = matter(readFileSync(defaultFile, 'utf-8'))
  const frontmatter = { ...data }
  const extractedImage = extractPostImage(frontmatter as Record<string, unknown>, content)
  if (extractedImage && typeof frontmatter.image !== 'string')
    frontmatter.image = extractedImage

  const isPost = isPostMarkdownFile(defaultFile, postsMarkdownRoot)
  const id = isPost && isPublishablePostData(frontmatter) ? normalizeNumericPostId(frontmatter) : null

  // GEO 元数据优先级：seo/posts/<id>.json > frontmatter > 正文首段派生；
  // 静态页（关于 / 友链 / FAQ）走 seo/pages.json。
  // 路由 meta 只放 head 与分享卡片需要的短字段，完整元数据留在构建期。
  let description = ''
  let keywords: string[] | undefined
  let faq: SeoFaqItem[] | undefined
  let keyPoints: string[] | undefined
  let pageTitle = String(frontmatter.title ?? '')

  if (isPost && id) {
    const resolved = resolvePostSeo({ id, frontmatter, content })
    description = resolved.description
    keywords = resolved.keywords
    faq = resolved.faq
    keyPoints = resolved.keyPoints
  }
  else {
    const page = getPageSeo(pagePathFromFile(defaultFile) ?? route.path)
    description = page?.description?.trim() || deriveDescription(content)
    keywords = page?.keywords
    pageTitle = page?.title?.trim() || String(frontmatter.title ?? '')
  }

  route.addToMeta({
    seo: {
      title: pageTitle,
      description,
      keywords,
      image: frontmatter.image,
      keyPoints,
      faq,
      date: frontmatter.date,
      updated: frontmatter.updated,
      tags: normalizeStringList(frontmatter.tags),
      categories: normalizeStringList(frontmatter.categories)
    }
  })

  if (!isPost || !isPublishablePostData(frontmatter))
    return

  if (!id)
    return
  const newPath = postPublicPath(id)
  route.path = newPath
  route.name = newPath
}
