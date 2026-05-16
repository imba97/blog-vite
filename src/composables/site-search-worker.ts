import type { SearchHit } from '~/types/search-index'
import type {
  SiteSearchMainToWorkerMessage,
  SiteSearchWorkerToMainMessage
} from '~/types/site-search-worker-protocol'

export const siteSearchWorkerReady = ref(false)
export const siteSearchWorkerError = ref<string | null>(null)

class SiteSearchWorkerClient {
  private worker: Worker | null = null
  private readyTask: Promise<void> | null = null
  private readyTaskResolve: (() => void) | null = null
  private readyTaskReject: ((error: Error) => void) | null = null
  private searchRequestId = 0
  private pendingLatestSearch: { requestId: number, resolve: (hits: SearchHit[]) => void } | null = null

  ensureReady(): Promise<void> {
    if (import.meta.env.SSR)
      return Promise.resolve()

    if (siteSearchWorkerReady.value)
      return Promise.resolve()

    if (this.readyTask)
      return this.readyTask

    const worker = this.getWorker()
    this.readyTask = new Promise<void>((resolve, reject) => {
      this.readyTaskResolve = resolve
      this.readyTaskReject = reject
    })
    siteSearchWorkerError.value = null
    const msg: SiteSearchMainToWorkerMessage = {
      type: 'init',
      baseUrl: import.meta.env.BASE_URL || '/'
    }
    worker.postMessage(msg)
    return this.readyTask
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
      this.resolvePendingLatestWithEmpty()
      this.pendingLatestSearch = { requestId, resolve }
      const msg: SiteSearchMainToWorkerMessage = {
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
    const d = ev.data as SiteSearchWorkerToMainMessage
    if (!d || typeof d !== 'object')
      return

    if (d.type === 'ready') {
      siteSearchWorkerReady.value = true
      siteSearchWorkerError.value = null
      this.resolveReadyTask()
      return
    }

    if (d.type === 'error') {
      this.handleWorkerErrorMessage(d.message)
      return
    }

    if (d.type === 'searchResult') {
      if (this.pendingLatestSearch?.requestId !== d.requestId)
        return
      const { resolve } = this.pendingLatestSearch
      this.pendingLatestSearch = null
      resolve(d.hits)
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
    this.rejectReadyTask(new Error(message))
    this.resolvePendingLatestWithEmpty()
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

  private resolvePendingLatestWithEmpty() {
    if (!this.pendingLatestSearch)
      return
    this.pendingLatestSearch.resolve([])
    this.pendingLatestSearch = null
  }

  private resolveReadyTask() {
    this.readyTaskResolve?.()
    this.clearReadyTaskReferences()
  }

  private rejectReadyTask(err: Error) {
    this.readyTaskReject?.(err)
    this.clearReadyTaskReferences()
  }

  private clearReadyTaskReferences() {
    this.readyTask = null
    this.readyTaskResolve = null
    this.readyTaskReject = null
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
