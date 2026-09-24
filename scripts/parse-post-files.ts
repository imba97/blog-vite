import { readFile } from 'node:fs/promises'
import matter from '@11ty/gray-matter'
import { glob } from 'tinyglobby'
import { postPublicPath } from '../src/constants/route-policy.ts'
import { comparePostDateDesc } from '../src/content/post-date.ts'
import {
  formatPostDateString,
  isPublishablePostData,
  normalizeNumericPostId
} from '../src/content/post-policy.ts'
import { POSTS_CONTENT_GLOB, POSTS_ROOT_INDEX_FILE } from './post-content-paths.ts'

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
 *
 * 进程内缓存：posts-meta / search-index 等多个生成器在同一构建进程里
 * 会重复调用本函数，全量解析所有 markdown 开销不小，结果在单次
 * 进程生命周期内不变（dev 下本就没有 watch 重跑），故 memoize。
 */
let cached: Promise<ParsedPostFile[]> | null = null

export function parsePostFiles(): Promise<ParsedPostFile[]> {
  if (!cached)
    cached = doParsePostFiles()
  return cached
}

async function doParsePostFiles(): Promise<ParsedPostFile[]> {
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
