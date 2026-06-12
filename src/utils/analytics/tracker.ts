import type { Router } from 'vue-router'
import type { AnalyticsEventName, AnalyticsEventPayload } from './types'
import { AnalyticsAdapter } from './adapter'

class Tracker {
  pageView(params: AnalyticsEventPayload['page_view']) {
    this.track('page_view', params)
  }

  postClick(params: AnalyticsEventPayload['article_click']) {
    this.track('article_click', params)
  }

  search(params: AnalyticsEventPayload['search']) {
    this.track('search', params)
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
