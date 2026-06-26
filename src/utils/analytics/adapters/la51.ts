import type { AnalyticsEventName, AnalyticsEventPayload } from '../types'
import { AnalyticsAdapter } from '../adapter'
import { LA_SITE_ID } from '../config'

export class La51AnalyticsAdapter extends AnalyticsAdapter {
  readonly name = '51la'

  protected override readonly url = 'https://sdk.51.la/js-sdk-pro.min.js'

  // 51la SDK 识别自身的固定 id
  protected override readonly id = 'LA_COLLECT'

  protected override onScriptLoaded(): void {
    window.LA?.init({
      id: LA_SITE_ID,
      ck: LA_SITE_ID,
      hashMode: true,
      autoTrack: true
    })
  }

  track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E]
  ): void {
    window.LA?.track?.(event, params as Record<string, unknown>)
  }
}
