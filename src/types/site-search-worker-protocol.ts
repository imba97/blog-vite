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
  /** 实际生效的检索引擎；wasm 不可用时会回退为 minisearch */
  engine?: 'wasm' | 'minisearch'
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
