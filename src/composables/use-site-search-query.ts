import type { SearchHit, SearchMetaRecord } from '~/types/search-index'
import type { PrefixKind, PrefixStrategy, SearchScope } from '~/utils/site-search-parse'
import { useDebounceFn } from '@vueuse/core'
import {
  ensureSiteSearchWorker,
  searchLatestViaWorker
} from '~/composables/site-search-worker'
import { tracker } from '~/utils/analytics'
import {
  emptyScope,
  filterSuggestCandidates,
  isBlockedScopePrefixKey,
  needleAfterPrefixChar,
  nextListboxIndex,
  prevListboxIndex,
  resolveActivePrefixStrategy,
  scopeHasChip,
  scopeToWorkerSlice,
  shouldAbortWorkerRound,
  shouldShowIdlePlaceholder
} from '~/utils/site-search-parse'

const DOUBLE_BACKSPACE_MS = 520

let searchMetaCandidatesLoaded = false
let searchMetaCandidatesInflight: Promise<void> | null = null

export interface ActiveSuggestSession {
  strategy: PrefixStrategy
  items: string[]
}

export function useSiteSearchQuery() {
  const scope = ref<SearchScope>(emptyScope())
  const keywordQuery = ref('')
  const hits = ref<SearchHit[]>([])
  const inputRef = ref<HTMLInputElement | null>(null)
  const pendingSearchVisual = ref(false)

  const allTags = ref<string[]>([])
  const allCategories = ref<string[]>([])
  const selectedSuggestIndex = ref(-1)

  let searchGeneration = 0
  let lastEmptyBackspaceAt = 0
  let tagDeletePrimeTimer: ReturnType<typeof setTimeout> | null = null
  const tagDeletePrimed = ref(false)

  const scopeTag = computed(() =>
    scope.value.kind === 'tag' ? scope.value.value : null
  )
  const scopeCategory = computed(() =>
    scope.value.kind === 'category' ? scope.value.value : null
  )

  const kwTrimmed = computed(() => keywordQuery.value.trim())

  function candidatesForKind(kind: PrefixKind): string[] {
    return kind === 'tag' ? allTags.value : allCategories.value
  }

  const activeSuggest = computed<ActiveSuggestSession | null>(() => {
    const strategy = resolveActivePrefixStrategy(scope.value, keywordQuery.value)
    if (!strategy)
      return null
    const needle = needleAfterPrefixChar(keywordQuery.value)
    const items = filterSuggestCandidates(candidatesForKind(strategy.kind), needle)
    if (items.length === 0)
      return null
    return { strategy, items }
  })

  const showSuggestDropdown = computed(() => activeSuggest.value != null)

  const activeSuggestListboxId = computed(() =>
    activeSuggest.value?.strategy.listboxId
  )

  const activeSuggestOptionId = computed(() => {
    const session = activeSuggest.value
    if (!session || selectedSuggestIndex.value < 0)
      return undefined
    const { optionIdPrefix } = session.strategy
    return `${optionIdPrefix}-${selectedSuggestIndex.value}`
  })

  const showIdlePlaceholder = computed(() =>
    shouldShowIdlePlaceholder(scope.value, kwTrimmed.value, keywordQuery.value)
  )

  function resetTagDeletePrime() {
    tagDeletePrimed.value = false
    if (tagDeletePrimeTimer != null) {
      clearTimeout(tagDeletePrimeTimer)
      tagDeletePrimeTimer = null
    }
    lastEmptyBackspaceAt = 0
  }

  function applyPrefixChoice(kind: PrefixKind, value: string) {
    if (kind === 'tag')
      scope.value = { kind: 'tag', value }
    else
      scope.value = { kind: 'category', value }

    keywordQuery.value = ''
    selectedSuggestIndex.value = -1
    resetTagDeletePrime()
    nextTick(() => {
      const el = inputRef.value
      if (!el)
        return
      el.focus()
      el.setSelectionRange(0, 0)
    })
  }

  async function loadCandidatesFromMeta() {
    if (import.meta.env.SSR)
      return
    if (searchMetaCandidatesLoaded)
      return

    if (!searchMetaCandidatesInflight) {
      searchMetaCandidatesInflight = (async () => {
        try {
          const base = import.meta.env.BASE_URL || '/'
          const res = await fetch(`${base}search-meta.json`)
          if (!res.ok)
            return

          const meta = await res.json() as SearchMetaRecord[]
          if (!Array.isArray(meta))
            return

          const tagSet = new Set<string>()
          const catSet = new Set<string>()
          for (const row of meta) {
            for (const tag of row.tags ?? [])
              tagSet.add(tag)
            for (const cat of row.categories ?? [])
              catSet.add(cat)
          }

          allTags.value = [...tagSet].sort((a, b) => a.localeCompare(b, 'zh-CN'))
          allCategories.value = [...catSet].sort((a, b) => a.localeCompare(b, 'zh-CN'))
          searchMetaCandidatesLoaded = true
        }
        catch {
          /* 联想失败则静默 */
        }
        finally {
          searchMetaCandidatesInflight = null
        }
      })()
    }

    await searchMetaCandidatesInflight
  }

  function focusKeywordInput() {
    nextTick(() => {
      inputRef.value?.focus()
    })
  }

  function primePrefixInput(prefixChar: PrefixStrategy['prefixChar']) {
    scope.value = emptyScope()
    keywordQuery.value = prefixChar
    selectedSuggestIndex.value = -1
    resetTagDeletePrime()
    nextTick(() => {
      const el = inputRef.value
      if (!el)
        return
      el.focus()
      const caret = el.value.length
      el.setSelectionRange(caret, caret)
    })
  }

  /** 弹层打开时：拉候选 + 预加载 Worker（与全局 `/` 打开搜索共存，勿在 composable 内拦截 `/`） */
  function onOverlayOpened() {
    void loadCandidatesFromMeta()
    void ensureSiteSearchWorker().catch(() => {})
  }

  function clearAll() {
    scope.value = emptyScope()
    keywordQuery.value = ''
    resetTagDeletePrime()
    inputRef.value?.focus()
  }

  function resetForOverlayClose() {
    scope.value = emptyScope()
    keywordQuery.value = ''
    hits.value = []
    pendingSearchVisual.value = false
    selectedSuggestIndex.value = -1
    resetTagDeletePrime()
    searchGeneration++
  }

  async function scrollActiveSuggestIntoView() {
    await nextTick()
    const session = activeSuggest.value
    const i = selectedSuggestIndex.value
    if (!session || i < 0)
      return
    const id = `${session.strategy.optionIdPrefix}-${i}`
    document.getElementById(id)?.scrollIntoView({ block: 'nearest' })
  }

  function handleKeywordKeydown(e: KeyboardEvent) {
    if (isBlockedScopePrefixKey(scope.value, e.key)) {
      e.preventDefault()
      return
    }

    const chip = scopeHasChip(scope.value)
    if (e.key === 'Backspace' && chip && keywordQuery.value === '') {
      const now = Date.now()
      if (now - lastEmptyBackspaceAt < DOUBLE_BACKSPACE_MS) {
        e.preventDefault()
        resetTagDeletePrime()
        scope.value = emptyScope()
      }
      else {
        e.preventDefault()
        tagDeletePrimed.value = true
        if (tagDeletePrimeTimer != null)
          clearTimeout(tagDeletePrimeTimer)
        tagDeletePrimeTimer = setTimeout(() => {
          tagDeletePrimed.value = false
          lastEmptyBackspaceAt = 0
          tagDeletePrimeTimer = null
        }, DOUBLE_BACKSPACE_MS)
        lastEmptyBackspaceAt = now
      }
      return
    }

    const session = activeSuggest.value
    if (!session || session.items.length === 0)
      return

    const list = session.items

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedSuggestIndex.value = nextListboxIndex(selectedSuggestIndex.value, list.length)
      void scrollActiveSuggestIntoView()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedSuggestIndex.value = prevListboxIndex(selectedSuggestIndex.value)
      void scrollActiveSuggestIntoView()
      return
    }

    if (e.key === 'Enter' && selectedSuggestIndex.value >= 0) {
      e.preventDefault()
      const picked = list[selectedSuggestIndex.value]
      if (picked)
        applyPrefixChoice(session.strategy.kind, picked)
    }
  }

  watch(
    () => activeSuggest.value?.items,
    (items) => {
      if (!items?.length) {
        selectedSuggestIndex.value = -1
        return
      }
      selectedSuggestIndex.value = 0
    }
  )

  watch(keywordQuery, () => {
    resetTagDeletePrime()
  })

  const runDebouncedSearch = useDebounceFn(async () => {
    const gen = ++searchGeneration
    const kw = keywordQuery.value.trim()
    const { tag, category } = scopeToWorkerSlice(scope.value)

    if (shouldAbortWorkerRound(scope.value, kw)) {
      pendingSearchVisual.value = false
      return
    }

    try {
      await ensureSiteSearchWorker()
      if (gen !== searchGeneration)
        return

      const result = await searchLatestViaWorker({ tag, category, keywords: kw })
      if (gen !== searchGeneration)
        return

      hits.value = result
      tracker.search({
        keyword: kw,
        tag: tag ?? undefined,
        category: category ?? undefined,
        result_count: result.length
      })
    }
    catch {
      if (gen !== searchGeneration)
        return
      // 初始化失败或 Worker 异常时，统一回退为空结果，避免 UI 悬挂在旧数据。
      hits.value = []
    }
    finally {
      if (gen === searchGeneration)
        pendingSearchVisual.value = false
    }
  }, 1000)

  watch([scope, keywordQuery], () => {
    const kw = keywordQuery.value.trim()

    if (shouldAbortWorkerRound(scope.value, kw)) {
      searchGeneration++
      hits.value = []
      pendingSearchVisual.value = false
      return
    }

    pendingSearchVisual.value = true
    void runDebouncedSearch()
  })

  return {
    scopeTag,
    scopeCategory,
    keywordQuery,
    hits,
    inputRef,
    pendingSearchVisual,
    tagDeletePrimed,
    activeSuggest,
    showSuggestDropdown,
    activeSuggestListboxId,
    activeSuggestOptionId,
    selectedSuggestIndex,
    showIdlePlaceholder,
    applyPrefixChoice,
    handleKeywordKeydown,
    clearAll,
    resetForOverlayClose,
    onOverlayOpened,
    focusKeywordInput,
    primePrefixInput,
    loadCandidatesFromMeta,
    resetTagDeletePrime
  }
}
