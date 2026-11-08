/**
 * Cloudflare Pages Functions 与 Workers 的最小类型声明。
 *
 * 项目未引入 @cloudflare/workers-types（避免为少量函数增加重依赖），
 * 这里只声明本仓库实际使用的部分。约定：
 * - Pages 函数使用全局 `PagesFunction` / `PagesContext`
 * - Worker 模块使用全局 `WorkerHandler` / `WorkerEnv`
 */

/* ---------------------------------- 公共 ---------------------------------- */

/** Cloudflare 在边缘注入的请求元信息（只声明用到的字段） */
interface IncomingRequestCfProperties {
  /** ISO 3166-1 alpha-2 国家/地区代码，例如 "CN" */
  country?: string
  /** 一级行政区代码 */
  region?: string
  /** 城市名 */
  city?: string
  /** 时区，例如 "Asia/Shanghai" */
  timezone?: string
}

/** 带 cf 字段的 Request（仅 Cloudflare 运行时提供） */
interface CloudflareRequest extends Request {
  cf?: IncomingRequestCfProperties
}

interface ExecutionContext {
  waitUntil: (promise: Promise<unknown>) => void
  passThroughOnException: () => void
}

/* ------------------------------ Pages Functions ---------------------------- */

interface PagesContext<E = Record<string, unknown>> {
  request: CloudflareRequest
  next: () => Promise<Response>
  env: E
  params: Record<string, string | string[]>
  data: Record<string, unknown>
  functionPath: string
  waitUntil: (promise: Promise<unknown>) => void
}

interface PagesFunction<E = Record<string, unknown>> {
  (context: PagesContext<E>): Promise<Response> | Response
}

/* --------------------------------- Workers -------------------------------- */

/** workers/geo-router.ts 通过环境变量注入的配置 */
interface GeoRouterEnv {
  /** 国内 / 香港源站，例如 https://cn-origin.imba97.com */
  ORIGIN_CN?: string
  /** 海外源站，例如 https://imba97-blog.pages.dev */
  ORIGIN_GLOBAL?: string
  /** 走 CN 源站的国家码，逗号分隔，默认 CN,HK,MO,TW */
  CN_COUNTRIES?: string
}

interface WorkerHandler<E = Record<string, unknown>> {
  fetch: (
    request: CloudflareRequest,
    env: E,
    ctx: ExecutionContext
  ) => Promise<Response>
}
