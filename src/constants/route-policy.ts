/** 文章公开 URL 路径前缀（含尾部无斜杠的段前缀） */
export const POSTS_PATH_PREFIX = '/posts/'

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
