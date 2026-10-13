import type { SearchFullRecord, SearchHit } from '~/types/search-index'
import type { WasmSearchHit, WasmSearchIndex, WasmSearchModule } from '~/types/search-wasm'
import type {
  SiteSearchMainToWorkerMessage,
  SiteSearchQueryMessage,
  SiteSearchWorkerToMainMessage
} from '~/types/site-search-worker-protocol'
import MiniSearch from 'minisearch'
import { miniSearchTokenizer } from '~/utils/search-tokenize'

type SearchRequest = SiteSearchQueryMessage
type SearchResultEmitter = (msg: SiteSearchWorkerToMainMessage) => void

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

/**
 * 引擎选择：
 * - `auto`（默认）：先试 wasm，失败则回退 MiniSearch
 * - `wasm`：强制 wasm，失败即报错
 * - `minisearch`：强制旧引擎（排查用）
 */
type SearchEngineKind = 'auto' | 'wasm' | 'minisearch'

function resolvePreferredEngine(): SearchEngineKind {
  const raw = String(import.meta.env.VITE_SEARCH_ENGINE || 'auto').trim().toLowerCase()
  return raw === 'wasm' || raw === 'minisearch' ? raw : 'auto'
}

interface SearchBackend {
  readonly kind: 'wasm' | 'minisearch'
  search: (request: SearchRequest) => SearchHit[]
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

// ---------------------------------------------------------------------------
// MiniSearch 后端（回退路径）
// ---------------------------------------------------------------------------

interface SearchCorpus {
  mini: MiniSearch
  docsByPath: Map<string, SearchFullRecord>
  tagPathIndex: Map<string, Set<string>>
  categoryPathIndex: Map<string, Set<string>>
}

function createSearchCorpus(records: SearchFullRecord[]): SearchCorpus {
  const docsByPath = new Map<string, SearchFullRecord>()
  const tagPathIndex = new Map<string, Set<string>>()
  const categoryPathIndex = new Map<string, Set<string>>()
  const mini = new MiniSearch({
    fields: ['title', 'body', 'tagLine', 'catLine'],
    storeFields: ['path', 'title', 'date', 'text', 'tags', 'categories'],
    searchOptions: INDEX_SEARCH_OPTIONS,
    // 与 wasm 引擎逐字对齐的 CJK bigram 分词；不传则中文文档级召回只有 39.7%
    tokenize: miniSearchTokenizer
  })

  mini.addAll(
    records.map((d) => {
      docsByPath.set(d.path, d)

      for (const tag of d.tags) {
        const paths = tagPathIndex.get(tag)
        if (paths)
          paths.add(d.path)
        else
          tagPathIndex.set(tag, new Set([d.path]))
      }

      for (const category of d.categories) {
        const paths = categoryPathIndex.get(category)
        if (paths)
          paths.add(d.path)
        else
          categoryPathIndex.set(category, new Set([d.path]))
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

  return { mini, docsByPath, tagPathIndex, categoryPathIndex }
}

function resolveScopePaths(corpus: SearchCorpus, tag: string | null, category: string | null): Set<string> | null {
  const tagPaths = tag ? (corpus.tagPathIndex.get(tag) ?? new Set()) : null
  const categoryPaths = category ? (corpus.categoryPathIndex.get(category) ?? new Set()) : null

  if (tagPaths && categoryPaths)
    return intersectPathSets(tagPaths, categoryPaths)
  if (tagPaths)
    return tagPaths
  if (categoryPaths)
    return categoryPaths
  return null
}

function hitsFromScopedPaths(corpus: SearchCorpus, scopePaths: Set<string>, limit: number): SearchHit[] {
  const subset: SearchFullRecord[] = []
  for (const path of scopePaths) {
    const record = corpus.docsByPath.get(path)
    if (!record)
      continue
    subset.push(record)
    if (subset.length >= limit)
      break
  }
  return hitsFromDocs(subset, limit)
}

function searchInCorpus(corpus: SearchCorpus, request: SearchRequest): SearchHit[] {
  const kw = request.keywords.trim()
  const scopePaths = resolveScopePaths(corpus, request.tag, request.category)
  const limit = request.limit || SEARCH_LIMIT_DEFAULT

  if (!kw) {
    if (!scopePaths)
      return []
    return hitsFromScopedPaths(corpus, scopePaths, limit)
  }

  try {
    const results = corpus.mini.search(kw, SEARCH_OPTIONS)
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

class MiniSearchBackend implements SearchBackend {
  readonly kind = 'minisearch' as const
  private corpus: SearchCorpus | null = null

  static async create(baseUrl: string): Promise<MiniSearchBackend> {
    const backend = new MiniSearchBackend()
    const url = `${normalizeBase(baseUrl)}search-full.json`
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`加载搜索索引失败：${res.status} ${url}`)

    const records = JSON.parse(await res.text()) as SearchFullRecord[]
    if (!Array.isArray(records))
      throw new Error('搜索索引格式无效')

    backend.corpus = createSearchCorpus(records)
    return backend
  }

  search(request: SearchRequest): SearchHit[] {
    if (!this.corpus)
      return []
    return searchInCorpus(this.corpus, request)
  }
}

// ---------------------------------------------------------------------------
// wasm 后端（主路径）
// ---------------------------------------------------------------------------

async function fetchBytes(url: string, label: string): Promise<Uint8Array> {
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`加载${label}失败：${res.status} ${url}`)
  return new Uint8Array(await res.arrayBuffer())
}

/** 运行时动态 import `public/search/bigseek.js`（不经 Vite 打包，故用 @vite-ignore） */
async function importWasmGlue(baseUrl: string): Promise<WasmSearchModule> {
  const base = globalThis.location?.href ?? 'http://localhost/'
  const url = new URL(`${normalizeBase(baseUrl)}search/bigseek.js`, base).href
  return (await import(/* @vite-ignore */ url)) as WasmSearchModule
}

function toSearchHit(hit: WasmSearchHit): SearchHit {
  return {
    path: hit.path,
    title: hit.title,
    date: hit.date,
    snippet: hit.snippet,
    // wasm 侧返回的是同一份内存视图，复制成普通数组避免跨边界持有引用
    tags: [...hit.tags],
    categories: [...hit.categories]
  }
}

class WasmSearchBackend implements SearchBackend {
  readonly kind = 'wasm' as const

  private constructor(
    private readonly index: WasmSearchIndex,
    readonly docCount: number,
    readonly termCount: number
  ) {}

  static async create(baseUrl: string): Promise<WasmSearchBackend> {
    const base = normalizeBase(baseUrl)
    const [glue, wasmBytes, indexBytes] = await Promise.all([
      importWasmGlue(base),
      fetchBytes(`${base}search/bigseek_bg.wasm`, 'wasm 模块'),
      fetchBytes(`${base}search/search.idx`, '搜索索引')
    ])

    if (typeof glue?.default !== 'function' || typeof glue?.SearchIndex !== 'function')
      throw new Error('wasm glue 模块形状异常（缺少 default / SearchIndex）')

    await glue.default({ module_or_path: wasmBytes })
    const index = new glue.SearchIndex(indexBytes)
    return new WasmSearchBackend(index, index.docCount(), index.termCount())
  }

  search(request: SearchRequest): SearchHit[] {
    try {
      const hits = this.index.query(
        request.keywords,
        request.tag,
        request.category,
        request.limit || SEARCH_LIMIT_DEFAULT
      )
      return hits.map(toSearchHit)
    }
    catch (error) {
      console.warn('[site-search] wasm 查询失败，本轮返回空结果', error)
      return []
    }
  }
}

// ---------------------------------------------------------------------------
// 引擎调度
// ---------------------------------------------------------------------------

export const __siteSearchWorkerTestables = {
  normalizeBase,
  buildSnippet,
  intersectPathSets
}

export class SearchEngine {
  private backend: SearchBackend | null = null
  private initialized = false
  private queuedSearch: { request: SearchRequest, emit: SearchResultEmitter } | null = null
  private searchFlushScheduled = false
  private searchFlushRunning = false

  async init(baseUrl: string): Promise<void> {
    if (this.initialized)
      return

    const preferred = resolvePreferredEngine()
    if (preferred !== 'minisearch') {
      try {
        this.backend = await WasmSearchBackend.create(baseUrl)
        this.initialized = true
        return
      }
      catch (error) {
        if (preferred === 'wasm')
          throw error
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`[site-search] wasm 引擎不可用，回退 MiniSearch：${message}`)
      }
    }

    this.backend = await MiniSearchBackend.create(baseUrl)
    this.initialized = true
  }

  get engineKind(): 'wasm' | 'minisearch' | null {
    return this.backend?.kind ?? null
  }

  enqueueLatestSearch(request: SearchRequest, emit: SearchResultEmitter) {
    this.queuedSearch = { request, emit }
    if (!this.searchFlushScheduled) {
      this.searchFlushScheduled = true
      queueMicrotask(() => this.flushQueuedSearch())
    }
  }

  private search(request: SearchRequest): SearchHit[] {
    if (!this.backend)
      return []
    return this.backend.search(request)
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

  async handleMessage(ev: MessageEvent<SiteSearchMainToWorkerMessage>) {
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
      this.emit({ type: 'ready', engine: this.engine.engineKind ?? undefined })
    }
    catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      this.emit({ type: 'error', message })
    }
  }
}

const engine = new SearchEngine()
const bridge = new WorkerMessageBridge(engine, msg => globalThis.postMessage(msg))

globalThis.onmessage = (ev: MessageEvent<SiteSearchMainToWorkerMessage>) => {
  void bridge.handleMessage(ev)
}
