import { readFile } from 'node:fs/promises'
import matter from 'gray-matter'
import { glob } from 'tinyglobby'
import { postPublicPath } from '../src/constants/route-policy'
import { comparePostDateDesc } from '../src/content/post-date'
import {
  formatPostDateString,
  isPublishablePostData,
  normalizeNumericPostId
} from '../src/content/post-policy'
import { POSTS_CONTENT_GLOB, POSTS_ROOT_INDEX_FILE } from './post-content-paths'

export interface ParsedPostFile {
  /** 源文件路径（相对仓库根） */
  file: string
  /** 数字 id 字符串 */
  idStr: string
  /** 公开路由路径，如 /posts/123 */
  path: string
  /** frontmatter 数据 */
  data: Record<string, unknown>
  /** Markdown 正文 */
  content: string
  /** 格式化后的日期字符串 */
  date: string
}

/**
 * 并发读取所有已发布文章，解析 frontmatter，
 * 并按日期降序返回（与列表、搜索索引、RSS 对齐）。
 */
export async function parsePostFiles(): Promise<ParsedPostFile[]> {
  const files = await glob(POSTS_CONTENT_GLOB)
  const candidates = files.filter(f => f !== POSTS_ROOT_INDEX_FILE)

  const results = (
    await Promise.all(
      candidates.map(async (file) => {
        const raw = await readFile(file, 'utf-8')
        const { data, content } = matter(raw)

        if (!isPublishablePostData(data))
          return null

        const idStr = normalizeNumericPostId(data as Record<string, unknown>)
        if (!idStr)
          return null

        return {
          file,
          idStr,
          path: postPublicPath(idStr),
          data: data as Record<string, unknown>,
          content,
          date: formatPostDateString(data.date)
        } satisfies ParsedPostFile
      })
    )
  ).filter((r): r is ParsedPostFile => r !== null)

  results.sort((a, b) => comparePostDateDesc(a.date, b.date))
  return results
}
