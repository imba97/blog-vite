import type { Router } from 'vue-router'
import { GA_MEASUREMENT_ID } from './config'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initGoogleAnalytics(router: Router) {
  if (!window.gtag)
    return

  router.afterEach((to) => {
    window.gtag!('config', GA_MEASUREMENT_ID, {
      page_path: to.fullPath
    })
  })
}
