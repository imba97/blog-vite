/**
 * 为单篇文章生成 GEO 元数据骨架：`seo/posts/<id>.json`（status=draft）。
 *
 * 用法：pnpm seo:new -- 817
 *
 * description 先用正文首段派生一个草稿，之后再用 `seo:write` 覆盖成
 * 人工梳理的版本；已有文件默认不覆盖，需要 --force。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import process from 'node:process'
import { parsePostFiles } from './parse-post-files.ts'
import { deriveDescription, postSeoFile, stripMarkdown } from './seo/load-seo.ts'
import { normalizePostSeo } from './seo/schema.ts'

const args = process.argv.slice(2).filter(item => item !== '--')
const id = args.find(item => /^\d+$/.test(item))
const force = args.includes('--force')

if (!id) {
  console.error('[seo:new] 用法：pnpm seo:new -- <文章 id> [--force]')
  process.exit(1)
}

const posts = await parsePostFiles()
const post = posts.find(item => item.idStr === id)

if (!post) {
  console.error(`[seo:new] 找不到已发布文章：id=${id}`)
  process.exit(1)
}

const target = postSeoFile(id)
if (!force && await fileExists(target)) {
  console.error(`[seo:new] ${target} 已存在；确认覆盖请加 --force`)
  process.exit(1)
}

const keyPoints = stripMarkdown(post.content)
  .split(/(?<=[。！？!?])/)
  .map(item => item.trim())
  .filter(item => item.length >= 8)
  .slice(0, 3)

const entry = normalizePostSeo({
  description: deriveDescription(post.content),
  keyPoints,
  status: 'draft',
  reviewedAt: new Date().toISOString().slice(0, 10)
})

mkdirSync(dirname(target), { recursive: true })
writeFileSync(target, `${JSON.stringify(entry, null, 2)}\n`, 'utf-8')

console.log(`[seo:new] 写入 ${target}（draft，description 为正文派生草稿）`)

async function fileExists(path: string): Promise<boolean> {
  const { existsSync } = await import('node:fs')
  return existsSync(path)
}
