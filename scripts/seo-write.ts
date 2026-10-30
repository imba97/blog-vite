/**
 * 写入单篇文章的 GEO 元数据：`seo/posts/<id>.json`。
 *
 * 用法：
 *   pnpm seo:write -- --id 817 --file ./tmp/817.json
 *   cat 817.json | pnpm seo:write -- --id 817
 *
 * 写入前统一做 normalize + 校验；有 error 级问题直接退出，不会落盘。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { postSeoFile } from './seo/load-seo.ts'
import { normalizePostSeo, validatePostSeo } from './seo/schema.ts'

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index < 0)
    return undefined
  const value = process.argv[index + 1]
  return value && !value.startsWith('--') ? value : undefined
}

function fail(message: string): never {
  console.error(`[seo:write] ${message}`)
  process.exit(1)
}

const id = readArg('id')
if (!id || !/^\d+$/.test(id))
  fail('缺少合法的文章 id：--id <数字 id>')

const file = readArg('file')

let raw: string
try {
  // 没有 --file 时从 stdin 读（readFileSync(0) 在无输入时会抛错，一并兜住）
  raw = readFileSync(file ? resolve(file) : 0, 'utf-8')
}
catch {
  fail('没有读到 JSON 内容：用 --file <path> 或通过 stdin 传入')
}

let parsed: unknown
try {
  parsed = JSON.parse(raw)
}
catch (error) {
  fail(`JSON 解析失败：${error instanceof Error ? error.message : String(error)}`)
}

if (typeof parsed !== 'object' || parsed === null)
  fail('JSON 顶层必须是对象')

const entry = normalizePostSeo(parsed as Record<string, unknown>)
const issues = validatePostSeo(entry)
const errors = issues.filter(issue => issue.level === 'error')
const warnings = issues.filter(issue => issue.level === 'warn')

if (errors.length > 0) {
  for (const issue of errors)
    console.error(`  ✖ ${issue.field}: ${issue.message}`)
  fail('校验未通过，未写入')
}

const target = postSeoFile(id)
mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, `${JSON.stringify(entry, null, 2)}\n`, 'utf-8')

console.log(`[seo:write] 写入 ${target}`)
console.log(
  `  description ${[...entry.description].length} 字符`
  + ` · keywords ${entry.keywords?.length ?? 0}`
  + ` · keyPoints ${entry.keyPoints?.length ?? 0}`
  + ` · faq ${entry.faq?.length ?? 0}`
  + ` · status ${entry.status ?? 'draft'}`
)
for (const issue of warnings)
  console.warn(`  ⚠ ${issue.field}: ${issue.message}`)
