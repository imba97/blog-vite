import type { AnalyticsEventName, AnalyticsEventPayload } from '../types'
import { AnalyticsAdapter } from '../adapter'
import { LA_SITE_ID } from '../config'

export class La51AnalyticsAdapter extends AnalyticsAdapter {
  readonly name = '51la'

  init(): void {
    if (!window.LA)
      return

    window.LA.init({
      id: LA_SITE_ID,
      ck: LA_SITE_ID,
      hashMode: true
    })
  }

  track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E]
  ): void {
    window.LA?.track?.(event, params as Record<string, unknown>)
  }
}
