import { useRoute } from 'vue-router'
import { isArticlePostRoute, needsArticleStyles } from '~/utils/route-page-kind'

/**
 * 控制文章详情页正文的显隐时机。
 *
 * 渐显是页面进入的统一视觉优化，作用于所有进入 `/post/*` 的场景：
 * - 首次进入（直接打开 URL / 刷新）—— 等 CSS chunk 下载并应用。
 * - SPA 从任意页（首页 / 关于 / 友链 / 其他文章）跳转进入文章页 —— 立即触发。
 *
 * 实现要点：
 * 1. 每次进入文章页都先把 `ready` 重置为 `false`，等 Vue 渲染后
 *    （`nextTick`）再翻回 `true`，CSS transition 在两次状态翻转之间触发。
 * 2. CSS chunk 通过模块级标志 `articleCssImported` 跨多次进入复用，
 *    首次进入触发 `import()`，后续命中浏览器缓存立即 resolve。
 * 3. SSR 阶段保持 `ready=false`，客户端 hydrate 后再处理显隐切换。
 * 4. 用 markdown 渲染正文的静态页（关于 / 友链 / catch-all 404）也需要这份
 *    样式，但它们不做渐显：直接 `import()` 应用样式即可，否则从首页等处
 *    直接刷新进来时正文会完全没有样式。
 */

let articleCssImported = false

export function useArticleStyles() {
  const route = useRoute()
  const ready = ref(false)

  watch(
    () => route.path,
    async (path) => {
      const isArticle = isArticlePostRoute(path)
      if (!needsArticleStyles(path, route.params))
        return

      if (isArticle) {
        // 重置 ready，触发新一轮 fade-in（包括文章页之间互跳）
        ready.value = false
        // 等 `ready=false` 先渲染到 DOM（main.vue 用它切换加载占位 / 正文）
        await nextTick()
      }

      if (!articleCssImported) {
        // 首次进入：触发 article.ts 模块下载，Vite 会同时下载 CSS chunk
        await import('~/assets/styles/article')
        articleCssImported = true
      }

      if (!isArticle || import.meta.env.SSR)
        return

      // 翻转 ready，CSS transition 把 opacity:0 → 1 平滑过渡
      ready.value = true
    },
    { immediate: true }
  )

  return { ready }
}
