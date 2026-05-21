import { readFileSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { postPublicPath } from '../../src/constants/route-policy'
import { isPublishablePostData, normalizeNumericPostId } from '../../src/content/post-policy'
import { extractPostImage } from '../seo/extract-post-image'

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

export function applyMarkdownRouteMeta(route: RouteLike, postsMarkdownRoot: string): void {
  const defaultFile = route.components.get('default')
  if (!defaultFile || !defaultFile.endsWith('.md'))
    return

  const { data, content } = matter(readFileSync(defaultFile, 'utf-8'))
  const frontmatter = { ...data }
  const extractedImage = extractPostImage(frontmatter as Record<string, unknown>, content)
  if (extractedImage && typeof frontmatter.image !== 'string')
    frontmatter.image = extractedImage

  route.addToMeta({
    frontmatter
  })

  if (!isPostMarkdownFile(defaultFile, postsMarkdownRoot) || !isPublishablePostData(frontmatter))
    return

  const id = normalizeNumericPostId(frontmatter)
  if (!id)
    return
  const newPath = postPublicPath(id)
  route.path = newPath
  route.name = newPath
}
