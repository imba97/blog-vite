/**
 * 读取 `seo/` 侧车元数据，并把它与 frontmatter、正文派生结果合成。
 *
 * 只在构建期（Vite 插件 / SSG / CLI）使用，**不能**被浏览器端代码 import——
 * 浏览器侧只能拿到已经写进路由 meta 的那几个短字段。
 *
 * 解析优先级：`seo/posts/<id>.json` > frontmatter > 正文首段派生。
 */
import type { PostSeo, ResolvedPostSeo, SiteSeo } from '../../src/types/seo.ts'
import type { SeoIssue } from './schema.ts'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { normalizePostSeo, SEO_LIMITS, validatePostSeo } from './schema.ts'

const DEFAULT_ROOT = process.cwd()
const SITE_FILE = 'site.json'
const POSTS_DIR = 'posts'

export function seoDir(root = DEFAULT_ROOT): string {
  return resolve(root, 'seo')
}

export function postSeoFile(id: string, root = DEFAULT_ROOT): string {
  return join(seoDir(root), POSTS_DIR, `${id}.json`)
}

let siteCache: SiteSeo | null = null
let postCache: Map<string, PostSeo> | null = null

/** 站点级 JSON-LD / FAQ 需要的站点元数据 */
export function loadSiteSeo(root = DEFAULT_ROOT): SiteSeo {
  if (siteCache)
    return siteCache
  const file = join(seoDir(root), SITE_FILE)
  if (!existsSync(file))
    throw new Error(`[seo] 缺少站点元数据：${file}`)
  siteCache = JSON.parse(readFileSync(file, 'utf-8')) as SiteSeo
  return siteCache
}

export interface PageSeoEntry {
  /** 页面在 header 里显示的短标题（同时作为该页唯一的 h1） */
  navTitle?: string
  title?: string
  description?: string
  keywords?: string[]
}

let pageCache: Map<string, PageSeoEntry> | null = null

/** 静态页（首页 / 关于 / 友链 / 归档 / FAQ）的 SEO 描述，见 `seo/pages.json` */
export function loadPagesSeo(root = DEFAULT_ROOT): Map<string, PageSeoEntry> {
  if (pageCache)
    return pageCache
  const file = join(seoDir(root), 'pages.json')
  pageCache = new Map()
  if (existsSync(file)) {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as Record<string, PageSeoEntry>
    for (const [path, entry] of Object.entries(raw))
      pageCache.set(path, entry)
  }
  return pageCache
}

export function getPageSeo(path: string, root = DEFAULT_ROOT): PageSeoEntry | undefined {
  const map = loadPagesSeo(root)
  return map.get(path)
}

function readPostSeoFiles(root: string): Map<string, PostSeo> {
  const dir = join(seoDir(root), POSTS_DIR)
  const map = new Map<string, PostSeo>()
  if (!existsSync(dir))
    return map
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json'))
      continue
    const id = name.slice(0, -'.json'.length)
    const raw = JSON.parse(readFileSync(join(dir, name), 'utf-8')) as Record<string, unknown>
    map.set(id, normalizePostSeo(raw))
  }
  return map
}

export function loadPostSeoMap(root = DEFAULT_ROOT): Map<string, PostSeo> {
  if (!postCache)
    postCache = readPostSeoFiles(root)
  return postCache
}

export function getPostSeo(id: string, root = DEFAULT_ROOT): PostSeo | undefined {
  return loadPostSeoMap(root).get(id)
}

/** 清缓存：dev 下侧车文件变更后让 load 结果失效 */
export function invalidateSeoCache(): void {
  siteCache = null
  postCache = null
  pageCache = null
}

function charLength(value: string): number {
  return [...value].length
}

/** 去掉 markdown 语法，只留可读文本 */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s.*$/gm, ' ')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~`|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[。！？!?；;])/).map(item => item.trim()).filter(Boolean)
}

function truncate(text: string, max: number): string {
  return [...text].slice(0, max).join('')
}

/**
 * 从正文派生一段兜底描述：按句号累加，尽量落在 120–160 字符区间。
 * 仅用于没有侧车、也没有 frontmatter description 的文章。
 */
export function deriveDescription(content: string): string {
  const plain = stripMarkdown(content)
  if (!plain)
    return ''

  const sentences = splitSentences(plain)
  let result = ''
  for (const sentence of sentences) {
    if (charLength(result) >= SEO_LIMITS.description.min)
      break
    const next = result ? `${result}${sentence}` : sentence
    if (charLength(next) > SEO_LIMITS.description.max) {
      if (!result)
        return truncate(sentence, SEO_LIMITS.description.max)
      break
    }
    result = next
  }

  return result || truncate(plain, SEO_LIMITS.description.max)
}

interface FrontmatterLike {
  description?: unknown
  keywords?: unknown
}

function readFrontmatterKeywords(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    return list.length > 0 ? list : undefined
  }
  if (typeof value === 'string') {
    const list = value.split(/[,，]/).map(item => item.trim()).filter(Boolean)
    return list.length > 0 ? list : undefined
  }
  return undefined
}

/** 合成单篇文章的 GEO 元数据 */
export function resolvePostSeo(input: {
  id: string
  frontmatter?: FrontmatterLike
  content: string
  root?: string
}): ResolvedPostSeo {
  const sidecar = getPostSeo(input.id, input.root)
  if (sidecar) {
    return {
      ...sidecar,
      description: sidecar.description || deriveDescription(input.content),
      source: 'sidecar'
    }
  }

  const frontmatterDescription = typeof input.frontmatter?.description === 'string'
    ? input.frontmatter.description.trim()
    : ''

  if (frontmatterDescription) {
    return {
      description: frontmatterDescription,
      keywords: readFrontmatterKeywords(input.frontmatter?.keywords),
      source: 'frontmatter'
    }
  }

  return {
    description: deriveDescription(input.content),
    source: 'derived'
  }
}

export interface PostSeoAudit {
  id: string
  file: string
  status: string
  hasSidecar: boolean
  issues: SeoIssue[]
}

/** 校验磁盘上的全部侧车文件，返回问题列表（用于 `pnpm seo:check`） */
export function auditPostSeo(root = DEFAULT_ROOT): PostSeoAudit[] {
  const map = loadPostSeoMap(root)
  const audits: PostSeoAudit[] = []
  for (const [id, entry] of map) {
    audits.push({
      id,
      file: postSeoFile(id, root),
      status: entry.status ?? 'draft',
      hasSidecar: true,
      issues: validatePostSeo(entry)
    })
  }
  return audits.sort((a, b) => Number(b.id) - Number(a.id))
}
