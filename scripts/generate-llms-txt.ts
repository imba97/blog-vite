/**
 * 构建期生成 GEO 友好的站点地图：
 *
 * - llms.txt      精简版（站点结构 + 每段一句话摘要 + 链接），遵循 llmstxt.org 规范
 * - llms-full.txt 完整版（拼接全部已发布文章的 Markdown 正文），供模型一次性摄取
 *
 * 两个文件都写到 public/，由 Vite 在构建时拷贝到 dist/。
 */
import { Buffer } from 'node:buffer'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import matter from '@11ty/gray-matter'
import { glob } from 'tinyglobby'
import { postPublicPath, PROSE_CONTENT_PAGE_PATHS } from '../src/constants/route-policy.ts'
import { comparePostDateDesc } from '../src/content/post-date.ts'
import {
  formatPostDateString,
  isPublishablePostData,
  normalizeNumericPostId,
  normalizeStringList
} from '../src/content/post-policy.ts'

const SITE_URL = 'https://imba97.com'
const SITE_NAME = 'imba97 Blog'
const SITE_TAGLINE = '个人技术博客：前端工程、效率工具、随笔与折腾记录。'
const SITE_DESCRIPTION
  = 'imba97 的个人技术博客，记录前端工程、效率工具、开源折腾、踩坑笔记与日常思考。'

const POSTS_CONTENT_GLOB = 'posts/**/index.md'
const POSTS_ROOT_INDEX_FILE = 'posts/index.md'

const MAX_POSTS_IN_LLMS_TXT = 200
const LLMS_FULL_TXT_MAX_BYTES = 8 * 1024 * 1024 // 8 MiB 软上限

interface ParsedPostSummary {
  idStr: string
  path: string
  title: string
  description: string
  date: string
  tags: string[]
  categories: string[]
  /** 摘要（首段非空文本或 description） */
  excerpt: string
  content: string
}

function stripFrontmatter(raw: string): string {
  const match = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(raw)
  return match ? raw.slice(match[0].length) : raw
}

function pickExcerpt(content: string, fallback: string): string {
  const stripped = stripFrontmatter(content).trim()
  if (!stripped)
    return fallback
  // 抓第一段非空 markdown（遇空行停下）
  for (const paragraph of stripped.split(/\n\s*\n/)) {
    const text = paragraph
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // ![alt](src)
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](href)
      .replace(/[`*_>#~-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (text)
      return text.slice(0, 220)
  }
  return fallback.slice(0, 220)
}

async function loadPosts(): Promise<ParsedPostSummary[]> {
  const files = await glob(POSTS_CONTENT_GLOB)
  const candidates = files.filter(f => f !== POSTS_ROOT_INDEX_FILE)

  const records = (
    await Promise.all(
      candidates.map(async (file) => {
        const raw = await readFileSafe(file)
        if (raw == null)
          return null
        const { data, content } = matter(raw)
        if (!isPublishablePostData(data))
          return null
        const idStr = normalizeNumericPostId(data as Record<string, unknown>)
        if (!idStr)
          return null
        const title = String(data.title ?? '').trim() || `Post #${idStr}`
        const description = String(data.description ?? '').trim()
        const tags = normalizeStringList(data.tags)
        const categories = normalizeStringList(data.categories)
        return {
          idStr,
          path: postPublicPath(idStr),
          title,
          description,
          date: formatPostDateString(data.date),
          tags,
          categories,
          excerpt: pickExcerpt(content, description),
          content
        } satisfies ParsedPostSummary
      })
    )
  ).filter((r): r is ParsedPostSummary => r !== null)

  records.sort((a, b) => comparePostDateDesc(a.date, b.date))
  return records
}

async function readFileSafe(file: string): Promise<string | null> {
  try {
    return await readFile(file, 'utf-8')
  }
  catch {
    return null
  }
}

function buildLlmsTxt(posts: ParsedPostSummary[]): string {
  const lines: string[] = []
  lines.push(`# ${SITE_NAME}`)
  lines.push('')
  lines.push(`> ${SITE_TAGLINE}`)
  lines.push('')
  lines.push(SITE_DESCRIPTION)
  lines.push('')
  lines.push(`Canonical site: ${SITE_URL}`)
  lines.push(`RSS: ${SITE_URL}/feed.xml`)
  lines.push(`Sitemap: ${SITE_URL}/sitemap.xml`)
  lines.push(`Full dump (Markdown): ${SITE_URL}/llms-full.txt`)
  lines.push('')

  lines.push('## Sections')
  lines.push('')
  lines.push(`- [首页](${SITE_URL}/): 最新文章与项目精选`)
  for (const path of PROSE_CONTENT_PAGE_PATHS) {
    const label = path === '/about' ? '关于' : path === '/links' ? '友情链接' : path
    lines.push(`- [${label}](${SITE_URL}${path}): 站点级介绍页`)
  }
  lines.push(`- [RSS](${SITE_URL}/feed.xml): 订阅所有文章`)
  lines.push('')

  lines.push(`## Recent posts (${Math.min(posts.length, MAX_POSTS_IN_LLMS_TXT)} of ${posts.length})`)
  lines.push('')
  for (const post of posts.slice(0, MAX_POSTS_IN_LLMS_TXT)) {
    const summary = post.description || post.excerpt
    lines.push(`- [${post.title}](${SITE_URL}${post.path}): ${summary}`)
  }
  if (posts.length === 0)
    lines.push('- (暂无已发布文章)')

  lines.push('')
  lines.push('## Optional')
  lines.push('')
  lines.push(`- [完整 Markdown 全文（llms-full.txt）](${SITE_URL}/llms-full.txt): 拼接所有文章正文，供模型一次性摄取`)

  return `${lines.join('\n')}\n`
}

function buildLlmsFullTxt(posts: ParsedPostSummary[]): string {
  const blocks: string[] = []
  for (const post of posts) {
    const tagsLine = post.tags.length ? `tags: ${post.tags.join(', ')}` : ''
    const catsLine = post.categories.length ? `categories: ${post.categories.join(', ')}` : ''
    const meta = [`url: ${SITE_URL}${post.path}`, `date: ${post.date}`, tagsLine, catsLine]
      .filter(Boolean)
      .join(' | ')

    const body = stripFrontmatter(post.content).trim()
    blocks.push(`# ${post.title}\n\n${meta}\n\n${body}\n\n---`)
  }
  let text = `# ${SITE_NAME} — 全文 Markdown dump\n\nGenerated at ${new Date().toISOString()}\nTotal posts: ${posts.length}\n\n${blocks.join('\n\n')}\n`

  if (Buffer.byteLength(text, 'utf-8') > LLMS_FULL_TXT_MAX_BYTES) {
    // 超大时截断到上限前一行，并标注截断
    const truncated = text.slice(0, LLMS_FULL_TXT_MAX_BYTES)
    const lastSeparator = truncated.lastIndexOf('\n\n---\n')
    text = `${truncated.slice(0, lastSeparator)}\n\n... (剩余 ${posts.length} 篇因超过 ${LLMS_FULL_TXT_MAX_BYTES} 字节被截断，请按需分段摄取)\n`
  }

  return text
}

export interface LlmsTxtStats {
  posts: number
  llmsBytes: number
  llmsFullBytes: number
}

export async function generateLlmsTxt(outDir = 'public'): Promise<LlmsTxtStats> {
  const posts = await loadPosts()
  const llmsTxt = buildLlmsTxt(posts)
  const llmsFullTxt = buildLlmsFullTxt(posts)

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'llms.txt'), llmsTxt, 'utf-8')
  await writeFile(join(outDir, 'llms-full.txt'), llmsFullTxt, 'utf-8')

  return {
    posts: posts.length,
    llmsBytes: Buffer.byteLength(llmsTxt, 'utf-8'),
    llmsFullBytes: Buffer.byteLength(llmsFullTxt, 'utf-8')
  }
}

// CLI 入口（pnpm run generate-llms）
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const stats = await generateLlmsTxt()
  console.log(
    `[llms-txt] 写入 public/llms.txt (${(stats.llmsBytes / 1024).toFixed(1)} KiB)`
    + ` 与 public/llms-full.txt (${(stats.llmsFullBytes / 1024).toFixed(1)} KiB)`
    + ` · ${stats.posts} 篇文章`
  )
}
