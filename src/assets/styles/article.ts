/**
 * 文章正文（markdown）样式。
 *
 * 这些样式只在渲染 `.prose` 正文的页面需要：文章详情 `/post/*`，以及用
 * markdown 渲染的静态页（关于 / 友链 / catch-all 404）。首页、分页、归档等
 * 页面用不到，因此通过动态 `import()` 在客户端按需加载，避免拖慢首页 LCP。
 *
 * 加载入口：`src/layouts/main.vue` 中的 `useArticleStyles()`；
 * 判定见 `src/utils/route-page-kind.ts` 的 `needsArticleStyles`。
 */
import 'markdown-it-github-alerts/styles/github-base.css'
import 'markdown-it-github-alerts/styles/github-colors-dark-class.css'
import 'markdown-it-github-alerts/styles/github-colors-light.css'
import './prose.css'
import './markdown.css'
import './copy-button.scss'

export {}
