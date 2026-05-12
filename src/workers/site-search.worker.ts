import type { SearchFullRecord, SearchHit } from '~/types/search-index'
import MiniSearch from 'minisearch'

type MainToWorker
  = | { type: 'init', baseUrl: string }
    | { type: 'search', tag: string | null, category: string | null, keywords: string, limit: number, requestId: number }

type WorkerToMain
  = | { type: 'ready' }
    | { type: 'error', message: string }
    | { type: 'searchResult', hits: SearchHit[], requestId: number }

let docs: SearchFullRecord[] = []
let mini: MiniSearch | null = null
let initialized = false

function normalizeBase(baseUrl: string): string {
  const u = baseUrl.trim()
  if (!u)
    return '/'
  return u.endsWith('/') ? u : `${u}/`
}

/** 片段高亮依据为关键词（不含 # 标签模式） */
function snippet(body: string, keywords: string): string {
  const q = keywords.trim().toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const first = words[0] ?? q
  if (!first)
    return body.slice(0, 140) + (body.length > 140 ? '…' : '')

  const lower = body.toLowerCase()
  const idx = lower.indexOf(first)
  const windowSize = 72
  if (idx === -1)
    return body.slice(0, 140) + (body.length > 140 ? '…' : '')
  const start = Math.max(0, idx - windowSize)
  const end = Math.min(body.length, idx + q.length + windowSize)
  return `${start > 0 ? '…' : ''}${body.slice(start, end)}${end < body.length ? '…' : ''}`
}

function buildMiniSearch(records: SearchFullRecord[]) {
  docs = records
  mini = new MiniSearch({
    fields: ['title', 'body', 'tagLine', 'catLine'],
    storeFields: ['path', 'title', 'date', 'text', 'tags', 'categories'],
    searchOptions: {
      boost: { title: 4, tagLine: 3, catLine: 2, body: 1 },
      fuzzy: 0.12,
      prefix: true
    }
  })

  mini.addAll(
    records.map(d => ({
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
    }))
  )
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

function handleSearch(tag: string | null, category: string | null, keywords: string, limit: number): SearchHit[] {
  const kw = keywords.trim()

  let scopePaths: Set<string> | null = null
  if (tag) {
    scopePaths = new Set(docs.filter(d => d.tags.includes(tag)).map(d => d.path))
  }
  if (category) {
    const catPaths = new Set(docs.filter(d => d.categories.includes(category)).map(d => d.path))
    scopePaths = scopePaths
      ? new Set([...scopePaths].filter(p => catPaths.has(p)))
      : catPaths
  }

  if (!kw) {
    if (!scopePaths)
      return []
    const subset = docs.filter(d => scopePaths!.has(d.path))
    return hitsFromDocs(subset, limit)
  }

  if (!mini)
    return []

  try {
    const results = mini.search(kw, {
      combineWith: 'AND',
      prefix: true,
      fuzzy: 0.12
    })

    const filtered = scopePaths
      ? results.filter(r => scopePaths!.has(String(r.path ?? r.id)))
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
        snippet: snippet(text, kw)
      }
    })
  }
  catch {
    return []
  }
}

async function handleInit(baseUrl: string): Promise<void> {
  if (initialized)
    return

  const base = normalizeBase(baseUrl)
  const url = `${base}search-full.json`
  const res = await fetch(url)
  if (!res.ok)
    throw new Error(`加载搜索索引失败：${res.status} ${url}`)

  const records = JSON.parse(await res.text()) as SearchFullRecord[]
  if (!Array.isArray(records))
    throw new Error('搜索索引格式无效')

  buildMiniSearch(records)
  initialized = true
}

function post(msg: WorkerToMain) {
  globalThis.postMessage(msg)
}

globalThis.onmessage = async (ev: MessageEvent<MainToWorker>) => {
  const msg = ev.data
  if (!msg || typeof msg !== 'object')
    return

  if (msg.type === 'init') {
    try {
      if (initialized) {
        post({ type: 'ready' })
        return
      }
      await handleInit(msg.baseUrl)
      post({ type: 'ready' })
    }
    catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      post({ type: 'error', message })
    }
    return
  }

  if (msg.type === 'search') {
    const hits = handleSearch(msg.tag, msg.category, msg.keywords, msg.limit)
    post({ type: 'searchResult', hits, requestId: msg.requestId })
  }
}
