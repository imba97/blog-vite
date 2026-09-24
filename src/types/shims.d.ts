import type { PostFrontmatter } from './post-frontmatter.ts'
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    frontmatter?: PostFrontmatter
  }
}
