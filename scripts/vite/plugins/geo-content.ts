import type { Plugin } from 'vite'
import process from 'node:process'
import matter from '@11ty/gray-matter'
import { getPostSeo } from '../../seo/load-seo.ts'

/**
 * 把侧车元数据里的「要点」与「FAQ」注入文章 markdown 正文：
 *
 * - 要点插在正文最前面（frontmatter 之后），渲染成 `## 本文要点` + 列表
 * - FAQ 追加在正文末尾，渲染成 `## 常见问题` + 问答
 *
 * 为什么在 markdown 阶段注入，而不是放进路由 meta：
 * 路由 meta 会进首屏入口 bundle，146 篇 × 几百字符白白拖大首屏；
 * 注入到 markdown 里则跟着文章 chunk 懒加载，同时保证 SSG 出来的 HTML
 * 里有这些内容（AI 抓得到）。
 */
export default function GeoContent(): Plugin {
  return {
    name: 'vite-plugin-geo-content',
    enforce: 'pre',
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/')
      if (!normalizedId.includes('/posts/') || !normalizedId.endsWith('/index.md'))
        return

      const frontmatterMatch = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(code)
      if (!frontmatterMatch)
        return

      let postId = ''
      try {
        const { data } = matter(code)
        postId = String((data as Record<string, unknown>).id ?? '').trim()
      }
      catch {
        return
      }
      if (!postId)
        return

      const seo = getPostSeo(postId)
      if (!seo)
        return

      const frontmatter = frontmatterMatch[0]
      const body = code.slice(frontmatter.length)
      const head: string[] = []
      const tail: string[] = []

      if (seo.keyPoints?.length) {
        head.push('## 本文要点')
        head.push('')
        for (const point of seo.keyPoints)
          head.push(`- ${point.replace(/\n+/g, ' ')}`)
        head.push('')
      }

      if (seo.faq?.length) {
        tail.push('## 常见问题')
        tail.push('')
        for (const item of seo.faq) {
          tail.push(`### ${item.question.replace(/\n+/g, ' ')}`)
          tail.push('')
          tail.push(item.answer.replace(/\n+/g, ' '))
          tail.push('')
        }
      }

      if (head.length === 0 && tail.length === 0)
        return

      const injected = `${frontmatter}${head.join('\n')}\n${body}${tail.length ? `\n\n${tail.join('\n')}` : ''}`

      if (process.env.NODE_ENV !== 'production')
        console.log(`[geo-content] 注入 ${seo.keyPoints?.length ?? 0} 条要点 / ${seo.faq?.length ?? 0} 条 FAQ → posts/${postId}`)

      return { code: injected, map: null }
    }
  }
}
