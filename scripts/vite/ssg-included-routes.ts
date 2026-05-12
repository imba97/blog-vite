/**
 * 仅由 vite.config 在 Node 下引用；勿从客户端代码 import（使用 process.env）。
 */
import process from 'node:process'

const DEFAULT_SSG_POST_PATH_RE = /^\/posts\/\d+$/

function parseSsgIncludeEnv(): RegExp[] {
  const raw = process.env.VITE_SSG_INCLUDE
  if (raw == null || String(raw).trim() === '')
    return [DEFAULT_SSG_POST_PATH_RE]
  const parsed = String(raw)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map((pattern) => {
      try {
        return new RegExp(pattern)
      }
      catch {
        return null
      }
    })
    .filter((x): x is RegExp => x != null)

  return parsed.length > 0 ? parsed : [DEFAULT_SSG_POST_PATH_RE]
}

const ssgMatchers = parseSsgIncludeEnv()

export function isSsgIncludedRoute(routePath: string): boolean {
  return ssgMatchers.some(re => re.test(routePath))
}
