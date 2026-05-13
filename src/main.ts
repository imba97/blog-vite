import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat.js'
import NProgress from 'nprogress'
import { createPinia } from 'pinia'
import { ViteSSG } from 'vite-ssg'
import { setupRouterScroller } from 'vue-router-better-scroller'
import { routes } from 'vue-router/auto-routes'
import App from './App.vue'
import { setupCopyCodeDelegation } from './composables/use-copy-code'
import { initAnalytics } from './utils/analytics/51.la'
import { isPostListRoute } from './utils/route-page-kind'

import './assets/styles/main.css'
import './assets/styles/prose.css'
import './assets/styles/markdown.css'
import './assets/styles/copy-button.scss'
import '@unocss/reset/tailwind.css'
import 'markdown-it-github-alerts/styles/github-colors-light.css'
import 'markdown-it-github-alerts/styles/github-colors-dark-class.css'
import 'markdown-it-github-alerts/styles/github-base.css'
import '@shikijs/twoslash/style-rich.css'
import 'shiki-magic-move/style.css'
import 'uno.css'

export const createApp = ViteSSG(
  App,
  {
    routes
  },
  ({ router, app }) => {
    dayjs.extend(LocalizedFormat)
    app.use(createPinia())

    if (!import.meta.env.SSR) {
      initAnalytics()

      const disposeCopyCode = setupCopyCodeDelegation()
      if (import.meta.hot)
        import.meta.hot.dispose(() => disposeCopyCode())

      const html = document.querySelector('html')!
      setupRouterScroller(router, {
        selectors: {
          html(ctx) {
            const isListRoute = isPostListRoute(ctx.to.path)
            const shouldResetToTop = isListRoute && ctx.type !== 'history'
            const targetPosition = shouldResetToTop ? { top: 0, left: 0 } : ctx.savedPosition

            // only do the sliding transition when the scroll position is not 0
            // Disable sliding transition on Dev Mode
            if (targetPosition?.top || import.meta.hot)
              html.classList.add('no-sliding')
            else
              html.classList.remove('no-sliding')

            if (shouldResetToTop)
              return { ...targetPosition, behavior: 'auto' }
            return true
          }
        },
        behavior: 'auto'
      })

      router.beforeEach(() => {
        NProgress.start()
      })
      router.afterEach(() => {
        NProgress.done()
      })
    }
  }
)
