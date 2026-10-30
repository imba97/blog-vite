import { useRoute } from 'vue-router'
import { isArticlePostRoute, needsArticleStyles } from '~/utils/route-page-kind'

/**
 * 控制文章详情页正文的显隐时机。
 *
 * 渐显是页面进入的统一视觉优化，作用于所有进入 `/post/*` 的场景：
 * - 首次进入（直接打开 URL / 刷新）—— 正文随 SSG 产物一起渲染，不再等待 CSS。
 * - SPA 从任意页（首页 / 关于 / 友链 / 其他文章）跳转进入文章页 —— 等 CSS chunk 就绪再显隐。
 *
 * 实现要点：
 * 1. **SSR 阶段必须渲染正文**：`ready` 在 SSR 下恒为 `true`，否则
 *    `main.vue` 会用「文章加载中」占位替换 `RouterView`，导致 SSG 产物里
 *    没有任何文章内容（爬虫与 AI 只能看到一个空壳）。
 * 2. 首屏（hydrate 的那一次）保持 `ready=true`，避免服务端与客户端
 *    首次渲染不一致引发 hydration mismatch；之后的 SPA 跳转才重置为
 *    `false` 再翻回 `true`，保留渐显效果。
 * 3. CSS chunk 通过模块级标志 `articleCssImported` 跨多次进入复用，
 *    首次进入触发 `import()`，后续命中浏览器缓存立即 resolve。
 * 4. 用 markdown 渲染正文的静态页（关于 / 友链 / catch-all 404）也需要这份
 *    样式，但它们不做渐显：直接 `import()` 应用样式即可，否则从首页等处
 *    直接刷新进来时正文会完全没有样式。
 */

let articleCssImported = false

export function useArticleStyles() {
  const route = useRoute()
  // SSR 直接给 true：正文必须出现在 SSG 产物里
  const ready = ref(import.meta.env.SSR)
  // 首屏路径：第一次 watch 回调就是 hydrate 的那一帧，不做渐显
  let isFirstRender = true

  watch(
    () => route.path,
    async (path) => {
      const isArticle = isArticlePostRoute(path)
      const shouldHandle = needsArticleStyles(path, route.params)
      const isInitialRender = isFirstRender
      isFirstRender = false

      if (!shouldHandle)
        return

      if (import.meta.env.SSR) {
        ready.value = true
        return
      }

      if (isArticle && !isInitialRender) {
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

      if (isArticle)
        ready.value = true
    },
    { immediate: true }
  )

  return { ready }
}
