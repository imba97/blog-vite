/** 文章公开 URL 路径前缀（含尾部无斜杠的段前缀） */
export const POSTS_PATH_PREFIX = '/posts/'

const ARCHIVES_PREFIX = '/archives/'

export function postPublicPath(numericId: string): string {
  return `${POSTS_PATH_PREFIX}${numericId}`
}

/** Twikoo 等评论系统使用的历史路径段 */
export function archiveCommentPathForPostId(id: string): string {
  return `${ARCHIVES_PREFIX}${id}`
}
