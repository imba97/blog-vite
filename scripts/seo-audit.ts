/**
 * 构建产物 SEO/GEO 体检：直接扫 `dist/**\/*.html`，按 GEO 检测的判定口径检查。
 *
 * 用法：pnpm seo:audit      （先跑一次 pnpm build）
 *
 * error 会让命令失败：缺 canonical、h1 不是恰好 1 个、JSON-LD 解析失败、
 * 缺 description / og:image。长度类问题只报 warn，避免挡住正常发布。
 */
import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import process from 'node:process'
import { glob } from 'tinyglobby'

const DIST = 'dist'
const SKIP = [/\.vite\//, /404\.html$/]

interface PageReport {
  file: string
  title: string
  titleLength: number
  descriptionLength: number
  h1Count: number
  hasCanonical: boolean
  jsonLdCount: number
  jsonLdValid: boolean
  hasOgImage: boolean
  hasRobots: boolean
  lang: string
}

function textLength(value: string): number {
  return [...value].length
}

function decodeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function auditFile(file: string): PageReport {
  const html = readFileSync(file, 'utf-8')

  const title = decodeEntities(/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '')
  const description = decodeEntities(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i.exec(html)?.[1] ?? '')
  const h1Count = (html.match(/<h1[\s>]/gi) ?? []).length
  const hasCanonical = /<link[^>]+rel="canonical"/i.test(html)
  const hasOgImage = /<meta[^>]+property="og:image"[^>]+content="https?:\/\//i.test(html)
  const hasRobots = /<meta[^>]+name="robots"/i.test(html)
  const lang = /<html[^>]+lang="([^"]*)"/i.exec(html)?.[1] ?? ''

  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  let jsonLdValid = blocks.length > 0
  for (const block of blocks) {
    try {
      JSON.parse(decodeEntities(block[1]))
    }
    catch {
      jsonLdValid = false
    }
  }

  return {
    file,
    title,
    titleLength: textLength(title),
    descriptionLength: textLength(description),
    h1Count,
    hasCanonical,
    jsonLdCount: blocks.length,
    jsonLdValid,
    hasOgImage,
    hasRobots,
    lang
  }
}

const files = (await glob(`${DIST}/**/*.html`)).filter(file => !SKIP.some(re => re.test(file)))
const reports = files.map(auditFile)

const errors: string[] = []
const warnings: string[] = []

for (const report of reports) {
  const where = relative(DIST, report.file)
  if (!report.hasCanonical)
    errors.push(`${where}: 缺少 canonical`)
  if (report.h1Count !== 1)
    errors.push(`${where}: h1 数量为 ${report.h1Count}，应恰好 1 个`)
  if (report.jsonLdCount === 0)
    errors.push(`${where}: 没有 JSON-LD`)
  else if (!report.jsonLdValid)
    errors.push(`${where}: JSON-LD 解析失败`)
  if (!report.descriptionLength)
    errors.push(`${where}: 缺少 description`)
  if (!report.hasOgImage)
    errors.push(`${where}: 缺少绝对地址的 og:image`)
  if (report.lang !== 'zh-CN')
    errors.push(`${where}: html lang 为 "${report.lang}"，应为 zh-CN`)

  if (report.titleLength < 30 || report.titleLength > 60)
    warnings.push(`${where}: title ${report.titleLength} 字符（建议 30–60）`)
  if (report.descriptionLength < 120 || report.descriptionLength > 160)
    warnings.push(`${where}: description ${report.descriptionLength} 字符（建议 120–160）`)
  if (!report.hasRobots)
    warnings.push(`${where}: 缺少 robots meta`)
}

const avgDescription = Math.round(
  reports.reduce((sum, report) => sum + report.descriptionLength, 0) / Math.max(reports.length, 1)
)

console.log(`体检 ${reports.length} 个页面 · 平均 description ${avgDescription} 字符`)
console.log(`canonical ${reports.filter(r => r.hasCanonical).length}/${reports.length}`
  + ` · 恰好一个 h1 ${reports.filter(r => r.h1Count === 1).length}/${reports.length}`
  + ` · 有效 JSON-LD ${reports.filter(r => r.jsonLdValid).length}/${reports.length}`
  + ` · lang=zh-CN ${reports.filter(r => r.lang === 'zh-CN').length}/${reports.length}`)

for (const warning of warnings.slice(0, 20))
  console.warn(`  ⚠ ${warning}`)
if (warnings.length > 20)
  console.warn(`  ⚠ …另有 ${warnings.length - 20} 条长度类提示`)

for (const error of errors)
  console.error(`  ✖ ${error}`)

console.log(`\n结果：${errors.length} 个 error · ${warnings.length} 个 warn`)

if (errors.length > 0)
  process.exit(1)
