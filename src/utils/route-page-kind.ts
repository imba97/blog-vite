import { POSTS_PATH_PREFIX } from '~/constants/route-policy'

/** 首页与分页列表 */
export function isPostListRoute(path: string): boolean {
  return path === '/' || path.startsWith('/page/')
}

/** 文章详情（数字 id 的 /post/... 由路由与策略保证） */
export function isArticlePostRoute(path: string): boolean {
  return path.startsWith(POSTS_PATH_PREFIX)
}

/** 主内容区可读宽度（非列表页），与历史 main 布局一致 */
export function isReadableLayoutRoute(path: string): boolean {
  return !isPostListRoute(path)
}

/** 是否展示 Twikoo 区块：非列表页（含 about、links 等） */
export function shouldShowTwikooSection(path: string): boolean {
  return !isPostListRoute(path)
}
