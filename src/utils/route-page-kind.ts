import { isProseContentPage, POSTS_PATH_PREFIX } from '~/constants/route-policy'

/** 首页与分页列表 */
export function isPostListRoute(path: string): boolean {
  return path === '/' || path.startsWith('/page/')
}

/** 文章详情（数字 id 的 /post/... 由路由与策略保证） */
export function isArticlePostRoute(path: string): boolean {
  return path.startsWith(POSTS_PATH_PREFIX)
}

/** catch-all 404 页（`pages/[...404].md`）的 params 带 `pathMatch`，正文同样是 markdown */
export function isCatchAllNotFoundRoute(params: Record<string, unknown>): boolean {
  return 'pathMatch' in params
}

/**
 * 是否需要文章正文样式（`src/assets/styles/article.ts`）：
 * 文章详情页、markdown 静态页（关于 / 友链 / catch-all 404）都渲染 `.prose` 正文。
 * 判断必须与 `scripts/vite/dedupe-stylesheets.ts` 的 SSG 后处理保持一致。
 */
export function needsArticleStyles(path: string, params: Record<string, unknown> = {}): boolean {
  return isArticlePostRoute(path) || isProseContentPage(path) || isCatchAllNotFoundRoute(params)
}

/** 主内容区可读宽度（非列表页），与历史 main 布局一致 */
export function isReadableLayoutRoute(path: string): boolean {
  return !isPostListRoute(path)
}

/** 是否展示 Twikoo 区块：非列表页（含 about、links 等） */
export function shouldShowTwikooSection(path: string): boolean {
  return !isPostListRoute(path)
}
