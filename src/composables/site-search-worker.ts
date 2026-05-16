import type { SearchHit } from '~/types/search-index'

type WorkerFromMain
  = | { type: 'init', baseUrl: string }
    | { type: 'search', tag: string | null, category: string | null, keywords: string, limit: number, requestId: number }

type WorkerToMain
  = | { type: 'ready' }
    | { type: 'error', message: string }
    | { type: 'searchResult', hits: SearchHit[], requestId: number }

export const siteSearchWorkerReady = ref(false)
export const siteSearchWorkerError = ref<string | null>(null)

class SiteSearchWorkerClient {
  private worker: Worker | null = null
  private initPosted = false
  private searchRequestId = 0
  private initWaiters: Array<{ resolve: () => void, reject: (e: Error) => void }> = []
  private pendingSearch = new Map<number, (hits: SearchHit[]) => void>()

  ensureReady(): Promise<void> {
    if (import.meta.env.SSR)
      return Promise.resolve()

    if (siteSearchWorkerReady.value)
      return Promise.resolve()

    const worker = this.getWorker()
    return new Promise<void>((resolve, reject) => {
      this.initWaiters.push({ resolve, reject })
      if (!this.initPosted) {
        this.initPosted = true
        const msg: WorkerFromMain = {
          type: 'init',
          baseUrl: import.meta.env.BASE_URL || '/'
        }
        worker.postMessage(msg)
      }
    })
  }

  async searchLatest(options: {
    tag: string | null
    category: string | null
    keywords: string
    limit?: number
  }): Promise<SearchHit[]> {
    if (import.meta.env.SSR)
      return []

    await this.ensureReady()

    const worker = this.getWorker()
    const requestId = ++this.searchRequestId
    const limit = options.limit ?? 40

    return new Promise((resolve) => {
      // 显式语义：仅保留最新请求，旧请求全部回收为空结果。
      this.resolveAllPendingSearchesWithEmpty()
      this.pendingSearch.set(requestId, resolve)
      const msg: WorkerFromMain = {
        type: 'search',
        tag: options.tag,
        category: options.category,
        keywords: options.keywords,
        limit,
        requestId
      }
      worker.postMessage(msg)
    })
  }

  private dispatch = (ev: MessageEvent) => {
    const d = ev.data as WorkerToMain
    if (!d || typeof d !== 'object')
      return

    if (d.type === 'ready') {
      siteSearchWorkerReady.value = true
      siteSearchWorkerError.value = null
      for (const w of this.initWaiters)
        w.resolve()
      this.initWaiters.length = 0
      return
    }

    if (d.type === 'error') {
      this.handleWorkerErrorMessage(d.message)
      return
    }

    if (d.type === 'searchResult') {
      const cb = this.pendingSearch.get(d.requestId)
      this.pendingSearch.delete(d.requestId)
      cb?.(d.hits)
    }
  }

  private getWorker(): Worker {
    if (import.meta.env.SSR)
      throw new Error('Worker 不可在 SSR 使用')

    if (!this.worker) {
      this.worker = new Worker(
        new URL('../workers/site-search.worker.ts', import.meta.url),
        { type: 'module' }
      )
      this.worker.onmessage = this.dispatch
      this.worker.onerror = (ev) => {
        this.handleWorkerFatal(ev.message || '站内搜索 Worker 运行异常')
      }
      this.worker.onmessageerror = () => {
        this.handleWorkerFatal('站内搜索 Worker 消息格式错误')
      }
    }

    return this.worker
  }

  private handleWorkerErrorMessage(message: string) {
    siteSearchWorkerError.value = message
    siteSearchWorkerReady.value = false
    this.initPosted = false
    this.rejectAllInitWaiters(new Error(message))
    this.resolveAllPendingSearchesWithEmpty()
  }

  private handleWorkerFatal(message: string) {
    this.handleWorkerErrorMessage(message)
    if (this.worker) {
      this.worker.onmessage = null
      this.worker.onerror = null
      this.worker.onmessageerror = null
      this.worker.terminate()
      this.worker = null
    }
  }

  private resolveAllPendingSearchesWithEmpty() {
    for (const resolve of this.pendingSearch.values())
      resolve([])
    this.pendingSearch.clear()
  }

  private rejectAllInitWaiters(err: Error) {
    for (const w of this.initWaiters)
      w.reject(err)
    this.initWaiters.length = 0
  }
}

const client = new SiteSearchWorkerClient()

/** 预加载索引（idle 调用）；可重复 await，就绪后立即 resolve */
export function ensureSiteSearchWorker(): Promise<void> {
  return client.ensureReady()
}

export async function searchLatestViaWorker(options: {
  tag: string | null
  category: string | null
  keywords: string
  limit?: number
}): Promise<SearchHit[]> {
  return client.searchLatest(options)
}

// 兼容旧调用点，后续可逐步迁移到 searchLatestViaWorker。
export const searchViaWorker = searchLatestViaWorker
