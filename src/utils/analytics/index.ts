import type { Router } from 'vue-router'
import { GoogleAnalyticsAdapter } from './adapters/google.ts'
import { La51AnalyticsAdapter } from './adapters/la51.ts'
import { tracker } from './tracker.ts'

export { AnalyticsAdapter } from './adapter.ts'
export type { AnalyticsAdapterClass } from './adapter.ts'
export { tracker } from './tracker.ts'
export type { AnalyticsEventName, AnalyticsEventPayload } from './types.ts'

export function initAnalytics(router: Router) {
  if (!import.meta.env.PROD)
    return

  GoogleAnalyticsAdapter.register()
  La51AnalyticsAdapter.register()
  tracker.init(router)
}
