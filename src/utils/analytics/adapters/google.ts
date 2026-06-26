import type { AnalyticsEventName, AnalyticsEventPayload } from '../types'
import { AnalyticsAdapter } from '../adapter'
import { GA_MEASUREMENT_ID } from '../config'

export class GoogleAnalyticsAdapter extends AnalyticsAdapter {
  readonly name = 'google'

  protected override readonly url = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`

  // GA 通过 head 内 inline 脚本调 gtag('config', ...) 完成初始化，
  // 不依赖 onScriptLoaded 钩子

  track<E extends AnalyticsEventName>(
    event: E,
    params: AnalyticsEventPayload[E]
  ): void {
    if (!window.gtag)
      return

    switch (event) {
      case 'page_view':
        this.sendPageView(params as AnalyticsEventPayload['page_view'])
        break
      case 'post_click':
        this.sendPostClick(params as AnalyticsEventPayload['post_click'])
        break
      case 'search':
        this.sendSearch(params as AnalyticsEventPayload['search'])
        break
      case 'outbound_click':
        this.sendOutboundClick(params as AnalyticsEventPayload['outbound_click'])
        break
    }
  }

  private sendPageView(params: AnalyticsEventPayload['page_view']) {
    window.gtag!('config', GA_MEASUREMENT_ID, {
      page_path: params.page_path,
      page_title: params.page_title
    })
  }

  private sendPostClick(params: AnalyticsEventPayload['post_click']) {
    window.gtag!('event', 'post_click', {
      post_path: params.post_path,
      post_title: params.post_title,
      source: params.source
    })
  }

  private sendSearch(params: AnalyticsEventPayload['search']) {
    window.gtag!('event', 'search', {
      search_term: params.keyword,
      tag: params.tag,
      category: params.category,
      result_count: params.result_count
    })
  }

  private sendOutboundClick(params: AnalyticsEventPayload['outbound_click']) {
    window.gtag!('event', 'outbound_click', {
      link_url: params.url,
      page_path: params.page_path
    })
  }
}
