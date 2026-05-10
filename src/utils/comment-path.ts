interface CommentPathStrategy {
  match: (routePath: string) => boolean
  resolve: (routePath: string) => string
}

const postRouteStrategy: CommentPathStrategy = {
  match: routePath => routePath.startsWith('/posts/'),
  resolve(routePath) {
    const segments = routePath.split('/').filter(Boolean)
    const id = segments.at(-1)
    if (!id)
      return ''

    return `/archives/${id}`
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
