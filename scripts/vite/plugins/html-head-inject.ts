import type { Plugin } from 'vite'
import process from 'node:process'
import { analyticsHeadTags } from '../analytics-head-tags'

/**
 * 通过 `transformIndexHtml` 向 `index.html` 注入标签（定义于 `analytics-head-tags.ts`）。
 * 统计脚本仅在 production 构建时注入。
 */
export default function HtmlHeadInject(): Plugin {
  return {
    name: 'html-head-inject',
    transformIndexHtml(html) {
      const tags = process.env.NODE_ENV === 'production' ? analyticsHeadTags : []
      return { html, tags }
    }
  }
}
