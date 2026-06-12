import type { Router } from 'vue-router'
import { initLaAnalytics } from './51.la'
import { initGoogleAnalytics } from './google'

export function initAnalytics(router: Router) {
  if (!import.meta.env.PROD)
    return

  initLaAnalytics()
  initGoogleAnalytics(router)
}
