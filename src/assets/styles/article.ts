/**
 * 文章详情页专用样式。
 *
 * 这些样式仅在进入 `/post/*` 路由时需要（首页、友链、关于等页面用不到），
 * 因此通过动态 `import()` 在客户端按需加载，避免拖慢首页 LCP。
 *
 * 加载入口：`src/layouts/main.vue` 中的 `useArticleStyles()`。
 */
import 'markdown-it-github-alerts/styles/github-base.css'
import 'markdown-it-github-alerts/styles/github-colors-dark-class.css'
import 'markdown-it-github-alerts/styles/github-colors-light.css'
import '@shikijs/twoslash/style-rich.css'
import '@shikijs/magic-move/style.css'
import './prose.css'
import './markdown.css'
import './copy-button.scss'

export {}
