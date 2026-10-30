/**
 * 校验 `seo/` 侧车元数据：字段约束 + 覆盖率。
 *
 * 用法：
 *   pnpm seo:check              校验全部
 *   pnpm seo:check -- 817 818   只校验指定文章
 *
 * 退出码：存在 error 级问题（status=done 但 description 不合规等）时为 1，
 * 仅覆盖率不足（有文章还没有侧车）时为 0，方便挂在提交前不影响正常发文。
 */
import process from 'node:process'
import { parsePostFiles } from './parse-post-files.ts'
import { auditPostSeo, loadPostSeoMap, loadSiteSeo } from './seo/load-seo.ts'
import { SEO_LIMITS } from './seo/schema.ts'

const args = process.argv.slice(2).filter(item => item !== '--')
const onlyIds = args.filter(item => /^\d+$/.test(item))

function charLength(value: string): number {
  return [...value].length
}

const site = loadSiteSeo()
const siteDescriptionLength = charLength(site.description)
const siteIssues: string[] = []
if (siteDescriptionLength < SEO_LIMITS.description.min || siteDescriptionLength > SEO_LIMITS.description.max)
  siteIssues.push(`description 为 ${siteDescriptionLength} 字符，应为 ${SEO_LIMITS.description.min}–${SEO_LIMITS.description.max}`)
if (!site.contact?.email)
  siteIssues.push('缺少 contact.email（Brand & Entity 检测项）')
if (!site.alternateNames?.length)
  siteIssues.push('缺少 alternateNames（品牌别名一致性）')

console.log(`站点：${site.name} · description ${siteDescriptionLength} 字符 · FAQ ${site.faq?.length ?? 0} 条`)
for (const issue of siteIssues)
  console.warn(`  ⚠ site.json: ${issue}`)

const posts = await parsePostFiles()
const publishedIds = posts.map(post => post.idStr)
const curated = loadPostSeoMap()
const targetIds = onlyIds.length > 0 ? onlyIds : publishedIds

const missing = onlyIds.length > 0 ? [] : publishedIds.filter(id => !curated.has(id))

const audits = auditPostSeo().filter(audit => targetIds.includes(audit.id))
let errorCount = 0
let warnCount = 0

for (const audit of audits) {
  const issues = audit.issues
  const done = audit.status === 'done'
  const errors = issues.filter(issue => issue.level === 'error')
  const warnings = issues.filter(issue => issue.level === 'warn')
  errorCount += errors.length
  warnCount += warnings.length

  if (issues.length === 0 && done)
    continue

  const mark = errors.length > 0 ? '✖' : warnings.length > 0 ? '⚠' : '·'
  console.log(`  ${mark} ${audit.id} [${audit.status}]`)
  for (const issue of issues)
    console.log(`      ${issue.level === 'error' ? '✖' : '⚠'} ${issue.field}: ${issue.message}`)
}

// 缺侧车的文章用派生描述兜底，这里只提示数量与最近几篇
if (missing.length > 0) {
  console.log(`\n覆盖率：${publishedIds.length - missing.length}/${publishedIds.length} 篇有侧车元数据，其余走正文派生兜底`)
  console.log(`待补：${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ' …' : ''}`)
}
else if (onlyIds.length === 0) {
  console.log(`\n覆盖率：${publishedIds.length}/${publishedIds.length} 篇有侧车元数据`)
}

// 指定 id 但文件不存在，也要报出来
for (const id of targetIds) {
  if (!curated.has(id) && onlyIds.includes(id)) {
    console.error(`  ✖ ${id}: 没有对应的 seo/posts/${id}.json`)
    errorCount += 1
  }
}

console.log(`\n结果：${audits.length} 篇已校验 · ${errorCount} 个 error · ${warnCount} 个 warn`)

if (errorCount > 0)
  process.exit(1)
