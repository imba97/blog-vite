import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { glob } from 'tinyglobby'
import { postPublicPath } from '../src/constants/route-policy'
import {
  formatPostDateString,
  isPublishablePostData,
  normalizeNumericPostId,
  normalizeStringList
} from '../src/content/post-policy'

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
  const files = await glob('pages/posts/**/index.md')
  const records: SearchFullRecord[] = []

  for (const file of files) {
    if (file === 'pages/posts/index.md')
      continue

    const raw = await readFile(file, 'utf-8')
    const { data, content } = matter(raw)

    if (!isPublishablePostData(data))
      continue

    const idStr = normalizeNumericPostId(data as Record<string, unknown>)!
    const path = postPublicPath(idStr)
    const meta: SearchMetaRecord = {
      id: idStr,
      path,
      title: String(data.title ?? ''),
      date: formatPostDateString(data.date),
      tags: normalizeStringList(data.tags),
      categories: normalizeStringList(data.categories)
    }

    records.push({
      ...meta,
      text: markdownToPlain(content)
    })
  }

  records.sort((a, b) => +new Date(b.date) - +new Date(a.date))

  const metaOnly: SearchMetaRecord[] = records.map(({ text: _t, ...m }) => m)

  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'search-meta.json'), JSON.stringify(metaOnly), 'utf-8')
  await writeFile(join(outDir, 'search-full.json'), JSON.stringify(records), 'utf-8')
}
