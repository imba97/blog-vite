/// <reference path="./pages.d.ts" />

import { isHtmlResponse, isSpecialPath } from './lib/html-cache'

/**
 * Cloudflare Pages Functions —— HTML 缓存头兜底
 *
 * 背景：_headers 无法表达 "*.html" 这种中间通配，而本站 HTML 需要
 * `public, max-age=0, must-revalidate`（等价 netlify.toml 的 *.html 规则），
 * 否则新文章发布后用户会长期看到旧页面。
 *
 * 注意：本函数挂的是 [[path]] 全捕获路由，Pages 静态资源命中优先级高于
 * Functions，因此只会处理未被静态文件匹配到的请求（SPA 兜底等）。
 */

const HTML_CACHE_CONTROL = 'public, max-age=0, must-revalidate'

export const onRequest: PagesFunction = async ({ request, next }) => {
  const { pathname } = new URL(request.url)

  const response = await next()

  if (request.method !== 'GET' && request.method !== 'HEAD')
    return response

  // 不由本函数改写 _headers 已明确声明的路径
  if (isSpecialPath(pathname))
    return response

  if (!isHtmlResponse(pathname, response.headers.get('content-type')))
    return response

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', HTML_CACHE_CONTROL)
  if (!headers.has('Vary'))
    headers.set('Vary', 'Accept-Encoding')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}
