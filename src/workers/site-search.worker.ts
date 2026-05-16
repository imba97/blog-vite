import type { SearchFullRecord, SearchHit } from '~/types/search-index'
import MiniSearch from 'minisearch'

type MainToWorker
  = | { type: 'init', baseUrl: string }
    | { type: 'search', tag: string | null, category: string | null, keywords: string, limit: number, requestId: number }

type WorkerToMain
  = | { type: 'ready' }
    | { type: 'error', message: string }
    | { type: 'searchResult', hits: SearchHit[], requestId: number }

type SearchRequest = Extract<MainToWorker, { type: 'search' }>
type SearchResultEmitter = (msg: WorkerToMain) => void

const SEARCH_LIMIT_DEFAULT = 40
const SNIPPET_WINDOW_SIZE = 72
const SNIPPET_MAX_LENGTH = 140
const SEARCH_OPTIONS = {
  combineWith: 'AND' as const,
  prefix: true,
  fuzzy: 0.12
}
const INDEX_SEARCH_OPTIONS = {
  boost: { title: 4, tagLine: 3, catLine: 2, body: 1 },
  fuzzy: 0.12,
  prefix: true
}

function normalizeBase(baseUrl: string): string {
  const u = baseUrl.trim()
  if (!u)
    return '/'
  return u.endsWith('/') ? u : `${u}/`
}

/** 片段高亮依据为关键词（不含 # 标签模式） */
function buildSnippet(body: string, keywords: string): string {
  const q = keywords.trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const first = words[0] ?? q
  if (!first)
    return body.slice(0, SNIPPET_MAX_LENGTH) + (body.length > SNIPPET_MAX_LENGTH ? '…' : '')

  const lower = body.toLowerCase()
  const idx = lower.indexOf(first)
  if (idx === -1)
    return body.slice(0, SNIPPET_MAX_LENGTH) + (body.length > SNIPPET_MAX_LENGTH ? '…' : '')
  const start = Math.max(0, idx - SNIPPET_WINDOW_SIZE)
  const end = Math.min(body.length, idx + q.length + SNIPPET_WINDOW_SIZE)
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`
}

function asStringList(v: unknown): string[] {
  if (!Array.isArray(v))
    return []
  return v.filter((x): x is string => typeof x === 'string')
}

function hitsFromDocs(subset: SearchFullRecord[], limit: number): SearchHit[] {
  return subset.slice(0, limit).map(d => ({
    path: d.path,
    title: d.title,
    date: d.date,
    snippet: '',
    tags: d.tags,
    categories: d.categories
  }))
}

function intersectPathSets(left: Set<string>, right: Set<string>): Set<string> {
  const [small, large] = left.size <= right.size
    ? [left, right]
    : [right, left]
  const output = new Set<string>()
  for (const path of small) {
    if (large.has(path))
      output.add(path)
  }
  return output
}

export const __siteSearchWorkerTestables = {
  normalizeBase,
  buildSnippet,
  intersectPathSets
}

export class SearchEngine {
  private mini: MiniSearch | null = null
  private initialized = false
  private docsByPath = new Map<string, SearchFullRecord>()
  private tagPathIndex = new Map<string, Set<string>>()
  private categoryPathIndex = new Map<string, Set<string>>()
  private queuedSearch: { request: SearchRequest, emit: SearchResultEmitter } | null = null
  private searchFlushScheduled = false
  private searchFlushRunning = false

  async init(baseUrl: string): Promise<void> {
    if (this.initialized)
      return

    const base = normalizeBase(baseUrl)
    const url = `${base}search-full.json`
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`加载搜索索引失败：${res.status} ${url}`)

    const records = JSON.parse(await res.text()) as SearchFullRecord[]
    if (!Array.isArray(records))
      throw new Error('搜索索引格式无效')

    this.buildMiniSearch(records)
    this.initialized = true
  }

  enqueueLatestSearch(request: SearchRequest, emit: SearchResultEmitter) {
    this.queuedSearch = { request, emit }
    if (!this.searchFlushScheduled) {
      this.searchFlushScheduled = true
      queueMicrotask(() => this.flushQueuedSearch())
    }
  }

  private buildMiniSearch(records: SearchFullRecord[]) {
    this.docsByPath = new Map()
    this.tagPathIndex = new Map()
    this.categoryPathIndex = new Map()
    this.mini = new MiniSearch({
      fields: ['title', 'body', 'tagLine', 'catLine'],
      storeFields: ['path', 'title', 'date', 'text', 'tags', 'categories'],
      searchOptions: INDEX_SEARCH_OPTIONS
    })

    this.mini.addAll(
      records.map((d) => {
        this.docsByPath.set(d.path, d)

        for (const tag of d.tags) {
          const paths = this.tagPathIndex.get(tag)
          if (paths)
            paths.add(d.path)
          else
            this.tagPathIndex.set(tag, new Set([d.path]))
        }

        for (const category of d.categories) {
          const paths = this.categoryPathIndex.get(category)
          if (paths)
            paths.add(d.path)
          else
            this.categoryPathIndex.set(category, new Set([d.path]))
        }

        return {
          id: d.path,
          title: d.title,
          body: d.text,
          tagLine: d.tags.join(' '),
          catLine: d.categories.join(' '),
          path: d.path,
          date: d.date,
          text: d.text,
          tags: d.tags,
          categories: d.categories
        }
      })
    )
  }

  private resolveScopePaths(tag: string | null, category: string | null): Set<string> | null {
    const tagPaths = tag ? (this.tagPathIndex.get(tag) ?? new Set()) : null
    const categoryPaths = category ? (this.categoryPathIndex.get(category) ?? new Set()) : null

    if (tagPaths && categoryPaths)
      return intersectPathSets(tagPaths, categoryPaths)
    if (tagPaths)
      return tagPaths
    if (categoryPaths)
      return categoryPaths
    return null
  }

  private hitsFromScopedPaths(scopePaths: Set<string>, limit: number): SearchHit[] {
    const subset: SearchFullRecord[] = []
    for (const path of scopePaths) {
      const record = this.docsByPath.get(path)
      if (!record)
        continue
      subset.push(record)
      if (subset.length >= limit)
        break
    }
    return hitsFromDocs(subset, limit)
  }

  private search(request: SearchRequest): SearchHit[] {
    const kw = request.keywords.trim()
    const scopePaths = this.resolveScopePaths(request.tag, request.category)
    const limit = request.limit || SEARCH_LIMIT_DEFAULT

    if (!kw) {
      if (!scopePaths)
        return []
      return this.hitsFromScopedPaths(scopePaths, limit)
    }

    if (!this.mini)
      return []

    try {
      const results = this.mini.search(kw, SEARCH_OPTIONS)
      const filtered = scopePaths
        ? results.filter(r => scopePaths.has(String(r.path ?? r.id)))
        : results

      return filtered.slice(0, limit).map((r) => {
        const path = String(r.path ?? r.id)
        const title = String(r.title ?? '')
        const date = String(r.date ?? '')
        const text = String(r.text ?? '')
        const tags = asStringList(r.tags)
        const categories = asStringList(r.categories)
        return {
          path,
          title,
          date,
          tags,
          categories,
          snippet: buildSnippet(text, kw)
        }
      })
    }
    catch {
      return []
    }
  }

  private flushQueuedSearch() {
    this.searchFlushScheduled = false
    if (this.searchFlushRunning)
      return

    this.searchFlushRunning = true
    try {
      while (this.queuedSearch) {
        const current = this.queuedSearch
        this.queuedSearch = null

        const hits = this.search(current.request)
        if (this.queuedSearch)
          continue

        current.emit({ type: 'searchResult', hits, requestId: current.request.requestId })
      }
    }
    finally {
      this.searchFlushRunning = false
      if (this.queuedSearch && !this.searchFlushScheduled) {
        this.searchFlushScheduled = true
        queueMicrotask(() => this.flushQueuedSearch())
      }
    }
  }
}

class WorkerMessageBridge {
  constructor(
    private readonly engine: SearchEngine,
    private readonly emit: SearchResultEmitter
  ) {}

  async handleMessage(ev: MessageEvent<MainToWorker>) {
    const msg = ev.data
    if (!msg || typeof msg !== 'object')
      return

    if (msg.type === 'init') {
      await this.handleInit(msg.baseUrl)
      return
    }

    if (msg.type === 'search')
      this.engine.enqueueLatestSearch(msg, this.emit)
  }

  private async handleInit(baseUrl: string) {
    try {
      await this.engine.init(baseUrl)
      this.emit({ type: 'ready' })
    }
    catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      this.emit({ type: 'error', message })
    }
  }
}

const engine = new SearchEngine()
const bridge = new WorkerMessageBridge(engine, msg => globalThis.postMessage(msg))

globalThis.onmessage = (ev: MessageEvent<MainToWorker>) => {
  void bridge.handleMessage(ev)
}
