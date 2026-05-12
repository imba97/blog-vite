import { archiveCommentPathForPostId, POSTS_PATH_PREFIX } from '~/constants/route-policy'

interface CommentPathStrategy {
  match: (routePath: string) => boolean
  resolve: (routePath: string) => string
}

const postRouteStrategy: CommentPathStrategy = {
  match: routePath => routePath.startsWith(POSTS_PATH_PREFIX),
  resolve(routePath) {
    const segments = routePath.split('/').filter(Boolean)
    const id = segments.at(-1)
    if (!id)
      return ''

    return archiveCommentPathForPostId(id)
  }
}

const defaultRouteStrategy: CommentPathStrategy = {
  match: () => true,
  resolve: routePath => routePath
}

const commentPathStrategies: CommentPathStrategy[] = [
  postRouteStrategy,
  defaultRouteStrategy
]

export function resolveCommentPath(routePath: string) {
  const strategy = commentPathStrategies.find(item => item.match(routePath))
  return strategy?.resolve(routePath) || ''
}
