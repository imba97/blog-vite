/// <reference path="../functions/pages.d.ts" />

/**
 * 按访客所在国家/地区在两个源之间分流（反代，非 301 跳转，地址栏保持不变）
 *
 * 部署：Cloudflare Dashboard → Workers & Pages → 新建 Worker，粘贴本文件编译产物
 * 绑定路由：imba97.com/* 与 www.imba97.com/*
 *
 * 环境变量（Settings → Variables and Secrets）：
 *   ORIGIN_CN     国内 / 香港源站，例如 https://cn-origin.imba97.com
 *   ORIGIN_GLOBAL 海外源站，例如 https://imba97-blog.pages.dev
 *   CN_COUNTRIES  走 CN 源站的国家码，逗号分隔，默认 "CN,HK,MO,TW"
 *
 * 注意：
 * - 必须配合 Cache Rule 缓存 /assets/* 与 /uploads/*，否则会快速消耗免费额度
 * - 源站不可用时自动回退到 ORIGIN_GLOBAL，避免整站 502
 */

/** 内容不可变的静态资源前缀，命中后强制长缓存 */
const IMMUTABLE_PREFIXES = ['/assets/', '/uploads/']
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const DEFAULT_CN_COUNTRIES = 'CN,HK,MO,TW'

function normalizeOrigin(value: string | undefined): string {
  return (value ?? '').trim().replace(/\/+$/, '')
}

function parseCountrySet(value: string | undefined): Set<string> {
  return new Set(
    (value ?? DEFAULT_CN_COUNTRIES)
      .split(',')
      .map(item => item.trim().toUpperCase())
      .filter(Boolean)
  )
}

/** 把上游返回的 Location 改写成访客域名，避免暴露源站 */
function rewriteLocation(location: string, origin: string, publicOrigin: string): string {
  try {
    const resolved = new URL(location, origin)
    return new URL(resolved.pathname + resolved.search + resolved.hash, publicOrigin).toString()
  }
  catch {
    return location
  }
}

async function proxy(request: CloudflareRequest, origin: string): Promise<Response> {
  const sourceUrl = new URL(request.url)
  const targetUrl = new URL(sourceUrl.pathname + sourceUrl.search, origin)
  const clientIp = request.headers.get('CF-Connecting-IP') ?? ''

  const upstreamHeaders = new Headers(request.headers)
  upstreamHeaders.set('Host', new URL(origin).host)
  if (clientIp) {
    upstreamHeaders.set('X-Forwarded-For', clientIp)
    upstreamHeaders.set('X-Real-IP', clientIp)
  }
  upstreamHeaders.set('X-Forwarded-Proto', 'https')
  upstreamHeaders.set('X-Origin-Country', request.cf?.country ?? '')

  const init: RequestInit = {
    method: request.method,
    headers: upstreamHeaders,
    redirect: 'manual'
  }

  // GET / HEAD 不允许携带 body
  if (request.method !== 'GET' && request.method !== 'HEAD')
    init.body = request.body

  return fetch(targetUrl.toString(), init)
}

async function route(request: CloudflareRequest, env: GeoRouterEnv): Promise<Response> {
  const sourceUrl = new URL(request.url)
  const country = request.cf?.country ?? ''
  const useCn = parseCountrySet(env.CN_COUNTRIES).has(country.toUpperCase())

  const originCn = normalizeOrigin(env.ORIGIN_CN)
  const originGlobal = normalizeOrigin(env.ORIGIN_GLOBAL)

  // 两个源站都没配时，交给 Cloudflare 自身处理，避免整站不可用
  if (!originCn && !originGlobal)
    return fetch(request)

  const primary = useCn ? (originCn || originGlobal) : (originGlobal || originCn)

  // 预检请求直接透传
  if (request.method === 'OPTIONS')
    return fetch(request)

  let upstream: Response
  try {
    upstream = await proxy(request, primary)
  }
  catch (err) {
    const fallback = primary === originGlobal ? originCn : originGlobal
    if (fallback && fallback !== primary) {
      upstream = await proxy(request, fallback)
    }
    else {
      const message = err instanceof Error ? err.message : String(err)
      return new Response(`Origin unreachable: ${message}`, {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' }
      })
    }
  }

  const headers = new Headers(upstream.headers)

  const location = headers.get('location')
  if (location)
    headers.set('location', rewriteLocation(location, primary, sourceUrl.origin))

  // 去掉可能泄漏源站信息的响应头
  headers.delete('x-powered-by')
  headers.delete('server')

  const isImmutable = IMMUTABLE_PREFIXES.some(prefix => sourceUrl.pathname.startsWith(prefix))
  if (isImmutable && upstream.status === 200)
    headers.set('Cache-Control', IMMUTABLE_CACHE_CONTROL)

  // 便于排查实际命中的源站
  headers.set('X-Served-By', useCn ? 'cn' : 'global')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers
  })
}

export default {
  fetch(request, env) {
    return route(request, env)
  }
} satisfies WorkerHandler<GeoRouterEnv>
