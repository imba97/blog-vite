import type { PostFrontmatter } from './post-frontmatter'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    frontmatter?: PostFrontmatter
  }
}
