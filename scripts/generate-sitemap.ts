/**
 * 构建期生成 sitemap.xml（XML 1.0 + sitemap 0.9）：
 *
 * - 首页 / 静态 prose 页（/about、/links）
 * - 所有已发布文章（带 lastmod，RAG 偏好新鲜度信号）
 *
 * 写入 public/，由 Vite 在构建时拷贝到 dist/。
 */
import { Buffer } from 'node:buffer'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { postPublicPath, PROSE_CONTENT_PAGE_PATHS } from '../src/constants/route-policy.ts'
import { parsePostDateToTimestamp } from '../src/content/post-date.ts'
import { parsePostFiles } from './parse-post-files.ts'

const SITE_URL = 'https://imba97.com'

// XML 实体直接用 char code 拼，避免源文件里出现裸的 `<` `>` `&` 等被编辑器或写入路径误处理
const AMP = String.fromCharCode(38)
const LT = String.fromCharCode(60)
const GT = String.fromCharCode(62)

const ENTITY_AMP = `${AMP}#38;` // & 实体
const ENTITY_LT = `${AMP}lt;` // < 实体
const ENTITY_GT = `${AMP}gt;` // > 实体

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, ENTITY_AMP)
    .replace(/</g, ENTITY_LT)
    .replace(/>/g, ENTITY_GT)
    .replace(/"/g, `${AMP}quot;`)
    .replace(/'/g, `${AMP}#39;`)
}

function toIsoDate(value: string): string | null {
  const ts = parsePostDateToTimestamp(value)
  if (Number.isNaN(ts))
    return null
  return new Date(ts).toISOString()
}

interface SitemapEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

function buildSitemap(entries: SitemapEntry[]): string {
  const lines: string[] = []
  lines.push(`${LT}?xml version="1.0" encoding="UTF-8"?${GT}`)
  lines.push(`${LT}urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${GT}`)
  for (const entry of entries) {
    lines.push(`  ${LT}url${GT}`)
    lines.push(`    ${LT}loc${GT}${xmlEscape(entry.loc)}${LT}/loc${GT}`)
    if (entry.lastmod)
      lines.push(`    ${LT}lastmod${GT}${xmlEscape(entry.lastmod)}${LT}/lastmod${GT}`)
    if (entry.changefreq)
      lines.push(`    ${LT}changefreq${GT}${entry.changefreq}${LT}/changefreq${GT}`)
    if (entry.priority != null)
      lines.push(`    ${LT}priority${GT}${entry.priority.toFixed(1)}${LT}/priority${GT}`)
    lines.push(`  ${LT}/url${GT}`)
  }
  lines.push(`${LT}/urlset${GT}`)
  return `${lines.join('\n')}\n`
}

export interface SitemapStats {
  entries: number
  bytes: number
}

export async function generateSitemap(outFile = 'public/sitemap.xml'): Promise<SitemapStats> {
  const entries: SitemapEntry[] = []

  entries.push({
    loc: `${SITE_URL}/`,
    changefreq: 'daily',
    priority: 1.0
  })

  for (const path of PROSE_CONTENT_PAGE_PATHS) {
    entries.push({
      loc: `${SITE_URL}${path}`,
      changefreq: 'monthly',
      priority: 0.6
    })
  }

  const posts = await parsePostFiles()
  for (const post of posts) {
    const lastmod = toIsoDate(post.date)
    entries.push({
      loc: `${SITE_URL}${postPublicPath(post.idStr)}`,
      lastmod: lastmod ?? undefined,
      changefreq: 'monthly',
      priority: 0.8
    })
  }

  const xml = buildSitemap(entries)
  await mkdir(join(outFile, '..'), { recursive: true })
  await writeFile(outFile, xml, 'utf-8')

  return {
    entries: entries.length,
    bytes: Buffer.byteLength(xml, 'utf-8')
  }
}

// CLI 入口（pnpm run generate-sitemap）
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const stats = await generateSitemap()
  console.log(`[sitemap] 写入 public/sitemap.xml ${String.fromCharCode(183)} ${stats.entries} 条 URL ${String.fromCharCode(183)} ${(stats.bytes / 1024).toFixed(1)} KiB`)
}
