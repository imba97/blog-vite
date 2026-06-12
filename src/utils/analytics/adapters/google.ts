import type { AnalyticsEventName, AnalyticsEventPayload } from '../types'
import { AnalyticsAdapter } from '../adapter'
import { GA_MEASUREMENT_ID } from '../config'

export class GoogleAnalyticsAdapter extends AnalyticsAdapter {
  readonly name = 'google'

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
      case 'article_click':
        this.sendArticleClick(params as AnalyticsEventPayload['article_click'])
        break
      case 'search':
        this.sendSearch(params as AnalyticsEventPayload['search'])
        break
    }
  }

  private sendPageView(params: AnalyticsEventPayload['page_view']) {
    window.gtag!('config', GA_MEASUREMENT_ID, {
      page_path: params.page_path,
      page_title: params.page_title
    })
  }

  private sendArticleClick(params: AnalyticsEventPayload['article_click']) {
    window.gtag!('event', 'article_click', {
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
}
