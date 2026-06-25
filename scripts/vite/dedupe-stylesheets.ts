import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

/**
 * vite-ssg 后处理钩子：
 * 1. 去重每个渲染好的页面 HTML 中的 `<link rel="stylesheet" href="...">` 标签
 *    （vite-ssg 与 Vite 默认产物会重复写入同一资源）。
 * 2. 文章专属 CSS chunk（prose / markdown / shiki / twoslash / github-alerts）
 *    通过 Vite `manualChunks: 'article'` 隔离，在非文章详情页（首页 / 分页 /
 *    关于 / 友链等）移除对应 link 以避免拖累首屏；在文章详情页主动注入 link
 *    避免内容闪烁。
 *
 * 文章 CSS chunk 的实际文件名带 hash，这里通过读取 Vite manifest
 * 找到包含 `src/assets/styles/article.ts` 入口关联的 CSS 路径。
 */

// vite-ssg 的 ssr-manifest.json 是字符串数组形式：
// { "src/foo.ts": ["/assets/chunk-a.js", "/assets/chunk-a.css"], ... }
type SsrManifest = Record<string, string[]>

let cachedArticleCssHrefs: string[] | null = null

function loadArticleCssHrefs(): string[] {
  if (cachedArticleCssHrefs)
    return cachedArticleCssHrefs
  if (process.env.NODE_ENV !== 'production')
    return []

  const manifestPath = join(process.cwd(), 'dist', '.vite', 'ssr-manifest.json')
  let manifest: SsrManifest
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
  }
  catch {
    cachedArticleCssHrefs = []
    return cachedArticleCssHrefs
  }

  // article.ts 是唯一入口；其直接关联的 css 即文章专属 CSS chunk
  const articleEntry = manifest['src/assets/styles/article.ts'] ?? []
  const articleCss = new Set<string>()
  for (const file of articleEntry) {
    if (file.endsWith('.css')) {
      articleCss.add(`/${file.replace(/^\//, '')}`)
    }
  }
  cachedArticleCssHrefs = [...articleCss]
  return cachedArticleCssHrefs
}

function dedupeStylesheetLinks(html: string): { result: string, seen: Set<string> } {
  const seen = new Set<string>()
  const result = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
    (tag) => {
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
      if (!hrefMatch)
        return tag
      const href = hrefMatch[1]
      if (seen.has(href))
        return ''
      seen.add(href)
      return tag
    }
  )
  return { result, seen }
}

function injectStylesheetLinks(html: string, hrefs: string[]): string {
  if (hrefs.length === 0)
    return html
  const links = hrefs
    .filter(href => !html.includes(`href="${href}"`) && !html.includes(`href='${href}'`))
    .map(href => `<link rel="stylesheet" crossorigin="" href="${href}">`)
    .join('')
  if (!links)
    return html
  return html.replace(/<\/head>/i, `${links}</head>`)
}

function removeStylesheetLinks(html: string, hrefs: string[]): string {
  if (hrefs.length === 0)
    return html
  return html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]*>/gi,
    (tag) => {
      const hrefMatch = tag.match(/href=["']([^"']+)["']/i)
      if (!hrefMatch)
        return tag
      const href = hrefMatch[1]
      if (hrefs.includes(href))
        return ''
      return tag
    }
  )
}

export function dedupeStylesheetsInHtml(html: string, route?: string): string {
  const isArticlePage = !!route && /^\/post\//.test(route)
  const articleCssHrefs = loadArticleCssHrefs()

  // 第一步：去重已有的 stylesheet link
  let result = html
  if (isArticlePage) {
    // 文章页：移除文章专属 CSS 链接（避免去重逻辑把它干掉），稍后统一注入
    result = removeStylesheetLinks(result, articleCssHrefs)
    const deduped = dedupeStylesheetLinks(result)
    result = deduped.result
    // 注入文章专属 CSS link（保持首屏就有样式，避免内容闪烁）
    result = injectStylesheetLinks(result, articleCssHrefs)
  }
  else {
    // 非文章页：去掉文章专属 CSS，再去重
    result = removeStylesheetLinks(result, articleCssHrefs)
    result = dedupeStylesheetLinks(result).result
  }
  return result
}
