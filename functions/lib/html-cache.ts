/**
 * Cloudflare Pages Functions 共用的路径判定工具
 *
 * 背景：_headers 无法表达 "*.html" 这类中间通配，本站 HTML 需要
 * `public, max-age=0, must-revalidate`（等价 netlify.toml 的 *.html 规则），
 * 否则新文章发布后用户会长期看到旧页面，因此由 Functions 在响应时补头。
 */

/** 由 _headers 或运行时自身管理缓存头，不再被本模块改写的路径 */
const SPECIAL_PREFIXES = ['/search', '/cdn-cgi/']

const SPECIAL_EXACT = new Set([
  '/feed.xml',
  '/search-full.json',
  '/search-meta.json',
  '/sitemap.xml',
  '/robots.txt'
])

/** 无扩展名的路由（SPA 兜底）与文章页都返回 HTML */
export function isSpecialPath(pathname: string): boolean {
  if (SPECIAL_EXACT.has(pathname))
    return true
  return SPECIAL_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export function getExtension(pathname: string): string {
  const lastSlash = pathname.lastIndexOf('/')
  const lastDot = pathname.lastIndexOf('.')
  // 点在最后一个斜杠之前，说明是目录名里的点，不是扩展名
  if (lastDot <= lastSlash)
    return ''
  return pathname.slice(lastDot + 1).toLowerCase()
}

export function isHtmlResponse(pathname: string, contentType: string | null): boolean {
  if (contentType && contentType.includes('text/html'))
    return true

  const ext = getExtension(pathname)
  if (ext === 'html')
    return true

  // 无扩展名（SPA 路由、目录式访问）或文章页
  if (!ext)
    return true

  return pathname.startsWith('/post/')
}
