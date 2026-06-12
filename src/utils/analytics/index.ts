import type { Router } from 'vue-router'
import { GoogleAnalyticsAdapter } from './adapters/google'
import { La51AnalyticsAdapter } from './adapters/la51'
import { tracker } from './tracker'

export { AnalyticsAdapter } from './adapter'
export type { AnalyticsAdapterClass } from './adapter'
export { tracker } from './tracker'
export type { AnalyticsEventName, AnalyticsEventPayload } from './types'

export function initAnalytics(router: Router) {
  if (!import.meta.env.PROD)
    return

  GoogleAnalyticsAdapter.register()
  La51AnalyticsAdapter.register()
  tracker.init(router)
}
