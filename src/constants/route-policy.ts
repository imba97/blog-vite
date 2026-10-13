/** 文章公开 URL 路径前缀（含尾部无斜杠的段前缀） */
export const POSTS_PATH_PREFIX = '/post/'

/**
 * 用 markdown 渲染正文的静态页面（关于 / 友链），与文章详情页共用
 * `src/assets/styles/article.ts` 里的正文样式（prose / markdown）。
 *
 * 客户端按需加载（`use-article-styles`）与 SSG 后处理（`dedupe-stylesheets`）
 * 都必须覆盖这些路由，否则直接打开 / 刷新这些页面时正文没有样式。
 * 新增此类 markdown 页面时同步补充；catch-all 404 页由路由 params 判定，不在此列。
 */
export const PROSE_CONTENT_PAGE_PATHS: readonly string[] = ['/about', '/links']

/** 去掉尾部斜杠，让 `/about` 与 `/about/` 视为同一路由 */
function normalizeRoutePath(path: string): string {
  if (path.length <= 1)
    return path
  return path.replace(/\/+$/, '')
}

/** 是否是渲染 markdown 正文的静态页面 */
export function isProseContentPage(path: string): boolean {
  return PROSE_CONTENT_PAGE_PATHS.includes(normalizeRoutePath(path))
}

const ARCHIVES_PREFIX = '/archives/'

/** 旧静态 URL（如 /archives/781/index.html）经 catch-all 会得到带 index.html 的段，去掉后再拼规范路径 */
function stripTrailingIndexHtmlFromPathParam(segment: string): string {
  return segment.replace(/\/?index\.html$/i, '')
}

export function postPublicPath(numericId: string): string {
  return `${POSTS_PATH_PREFIX}${stripTrailingIndexHtmlFromPathParam(numericId)}`
}

/** Twikoo 等评论系统使用的历史路径段 */
export function archiveCommentPathForPostId(id: string): string {
  return `${ARCHIVES_PREFIX}${id}`
}
