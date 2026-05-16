import type { SearchHit } from '~/types/search-index'

export interface SiteSearchInitMessage {
  type: 'init'
  baseUrl: string
}

export interface SiteSearchQueryMessage {
  type: 'search'
  tag: string | null
  category: string | null
  keywords: string
  limit: number
  requestId: number
}

export type SiteSearchMainToWorkerMessage
  = | SiteSearchInitMessage
    | SiteSearchQueryMessage

export interface SiteSearchReadyMessage {
  type: 'ready'
}

export interface SiteSearchErrorMessage {
  type: 'error'
  message: string
}

export interface SiteSearchResultMessage {
  type: 'searchResult'
  hits: SearchHit[]
  requestId: number
}

export type SiteSearchWorkerToMainMessage
  = | SiteSearchReadyMessage
    | SiteSearchErrorMessage
    | SiteSearchResultMessage
