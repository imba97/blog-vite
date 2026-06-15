import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import MarkdownIt from 'markdown-it'
import { normalizeStringList } from '../src/content/post-policy'
import { parsePostFiles } from './parse-post-files'

const markdown = MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

const MAX_TEXT_CHARS = 100_000

export interface SearchMetaRecord {
  id: string
  path: string
  title: string
  date: string
  tags: string[]
  categories: string[]
}

export interface SearchFullRecord extends SearchMetaRecord {
  text: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function markdownToPlain(content: string): string {
  const plain = stripHtml(markdown.render(content))
  if (plain.length <= MAX_TEXT_CHARS)
    return plain
  return plain.slice(0, MAX_TEXT_CHARS)
}

/** 与 post store + SSG includedRoutes 对齐：非 draft、有 date、数字 id */
export async function generateSearchIndex(outDir: string): Promise<void> {
  const posts = await parsePostFiles()

  // parsePostFiles 已按日期降序排列，并发读取提升构建性能
  const records: SearchFullRecord[] = posts.map(({ idStr, path, data, content, date }) => ({
    id: idStr,
    path,
    title: String(data.title ?? ''),
    date,
    tags: normalizeStringList(data.tags),
    categories: normalizeStringList(data.categories),
    text: markdownToPlain(content)
  }))

  const metaOnly: SearchMetaRecord[] = records.map(({ text: _t, ...m }) => m)

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'search-meta.json'), JSON.stringify(metaOnly), 'utf-8')
  await writeFile(join(outDir, 'search-full.json'), JSON.stringify(records), 'utf-8')
}
