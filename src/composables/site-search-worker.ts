import type { SearchHit } from 'bigseek'
import { createSearchClient } from 'bigseek'

/**
 * 站内搜索 Worker 客户端。
 *
 * 请求对账、最新结果优先、错误与就绪状态机都在 `bigseek` 包里，这里只做适配：
 * 1. 告诉包怎么创建 Worker（`new URL(..., import.meta.url)` 是 Vite 特有的写法）；
 * 2. 把包的状态订阅回 Vue 的 ref —— `SearchDialog.vue` 已在消费这两个 ref。
 */

export const siteSearchWorkerReady = ref(false)
export const siteSearchWorkerError = ref<string | null>(null)

const client = createSearchClient({
  // SSR 下返回 null：包会安全空转，调用方不必自己判断环境
  worker: () => import.meta.env.SSR
    ? null
    : new Worker(new URL('../workers/site-search.worker.ts', import.meta.url), { type: 'module' }),
  debug: import.meta.env.DEV
})

client.subscribe((state) => {
  siteSearchWorkerReady.value = state.ready
  siteSearchWorkerError.value = state.error
})

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
  return client.search(options)
}
