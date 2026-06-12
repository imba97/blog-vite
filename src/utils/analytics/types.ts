export type AnalyticsEventName = 'page_view' | 'post_click' | 'search' | 'outbound_click'

export interface AnalyticsEventPayload {
  page_view: {
    page_path: string
    page_title?: string
  }
  post_click: {
    post_path: string
    post_title: string
    source: 'list' | 'search'
  }
  search: {
    keyword: string
    tag?: string
    category?: string
    result_count: number
  }
  outbound_click: {
    url: string
    page_path?: string
  }
}

export interface LaAnalytics {
  init: (options: { id: string, ck: string, hashMode?: boolean }) => void
  track?: (event: string, params?: Record<string, unknown>) => void
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    LA?: LaAnalytics
  }
}
