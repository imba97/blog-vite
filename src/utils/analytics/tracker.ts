import type { Router } from 'vue-router'
import type { AnalyticsEventName, AnalyticsEventPayload } from './types'
import { AnalyticsAdapter } from './adapter'

class Tracker {
  pageView(params: AnalyticsEventPayload['page_view']) {
    this.track('page_view', params)
  }

  postClick(params: AnalyticsEventPayload['post_click']) {
    this.track('post_click', params)
  }

  search(params: AnalyticsEventPayload['search']) {
    this.track('search', params)
  }

  outboundClick(params: Pick<AnalyticsEventPayload['outbound_click'], 'url'>) {
    this.track('outbound_click', {
      url: params.url,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined
    })
  }

  init(router: Router) {
    for (const adapter of AnalyticsAdapter.getRegistered())
      adapter.init(router)

    router.afterEach((to) => {
      this.pageView({
        page_path: to.fullPath,
        page_title: typeof document !== 'undefined' ? document.title : undefined
      })
    })
  }

  private track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E]
  ) {
    if (!import.meta.env.PROD)
      return

    for (const adapter of AnalyticsAdapter.getRegistered()) {
      try {
        adapter.track(event, params)
      }
      catch {
        /* 单个平台失败不影响其余适配器 */
      }
    }
  }
}

export const tracker = new Tracker()
