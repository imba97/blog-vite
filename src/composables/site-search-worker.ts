import type { SearchHit } from '~/types/search-index'

type WorkerFromMain
  = | { type: 'init', baseUrl: string }
    | { type: 'search', tag: string | null, category: string | null, keywords: string, limit: number, requestId: number }

type WorkerToMain
  = | { type: 'ready' }
    | { type: 'error', message: string }
    | { type: 'searchResult', hits: SearchHit[], requestId: number }

let worker: Worker | null = null
let initPosted = false
let searchRequestId = 0

const initWaiters: Array<{ resolve: () => void, reject: (e: Error) => void }> = []
const pendingSearch = new Map<number, (hits: SearchHit[]) => void>()

export const siteSearchWorkerReady = ref(false)
export const siteSearchWorkerError = ref<string | null>(null)

function dispatch(ev: MessageEvent) {
  const d = ev.data as WorkerToMain
  if (!d || typeof d !== 'object')
    return

  if (d.type === 'ready') {
    siteSearchWorkerReady.value = true
    siteSearchWorkerError.value = null
    for (const w of initWaiters)
      w.resolve()
    initWaiters.length = 0
  }

  if (d.type === 'error') {
    siteSearchWorkerError.value = d.message
    siteSearchWorkerReady.value = false
    initPosted = false
    const err = new Error(d.message)
    for (const w of initWaiters)
      w.reject(err)
    initWaiters.length = 0
  }

  if (d.type === 'searchResult') {
    const cb = pendingSearch.get(d.requestId)
    pendingSearch.delete(d.requestId)
    cb?.(d.hits)
  }
}

function getWorker(): Worker {
  if (import.meta.env.SSR)
    throw new Error('Worker 不可在 SSR 使用')

  if (!worker) {
    worker = new Worker(
      new URL('../workers/site-search.worker.ts', import.meta.url),
      { type: 'module' }
    )
    worker.onmessage = dispatch
  }
  return worker
}

/** 预加载索引（idle 调用）；可重复 await，就绪后立即 resolve */
export function ensureSiteSearchWorker(): Promise<void> {
  if (import.meta.env.SSR)
    return Promise.resolve()

  if (siteSearchWorkerReady.value)
    return Promise.resolve()

  const w = getWorker()

  return new Promise<void>((resolve, reject) => {
    initWaiters.push({ resolve, reject })
    if (!initPosted) {
      initPosted = true
      const msg: WorkerFromMain = {
        type: 'init',
        baseUrl: import.meta.env.BASE_URL || '/'
      }
      w.postMessage(msg)
    }
  })
}

export async function searchViaWorker(options: {
  tag: string | null
  category: string | null
  keywords: string
  limit?: number
}): Promise<SearchHit[]> {
  if (import.meta.env.SSR)
    return []

  await ensureSiteSearchWorker()

  const w = getWorker()
  const requestId = ++searchRequestId
  const limit = options.limit ?? 40

  return new Promise((resolve) => {
    pendingSearch.set(requestId, resolve)
    const msg: WorkerFromMain = {
      type: 'search',
      tag: options.tag,
      category: options.category,
      keywords: options.keywords,
      limit,
      requestId
    }
    w.postMessage(msg)
  })
}
