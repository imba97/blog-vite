/**
 * 站内搜索：scope、前缀挑选、Worker 参数 — 纯函数，便于扩展新前缀与测试。
 */

export const SUGGEST_PAGE_SIZE = 120

export type SearchScopeKind = 'none' | 'tag' | 'category'

export type SearchScope
  = | { kind: 'none' }
    | { kind: 'tag', value: string }
    | { kind: 'category', value: string }

export type PrefixKind = 'tag' | 'category'

export interface PrefixStrategy {
  kind: PrefixKind
  prefixChar: string
  listboxId: string
  optionIdPrefix: string
  listboxAriaLabel: string
  displayPrefix: string
}

export const PREFIX_STRATEGIES: readonly PrefixStrategy[] = [
  {
    kind: 'tag',
    prefixChar: '#',
    listboxId: 'tag-suggestions-listbox',
    optionIdPrefix: 'tag-suggest',
    listboxAriaLabel: '标签候选',
    displayPrefix: '#'
  },
  {
    kind: 'category',
    prefixChar: '/',
    listboxId: 'category-suggestions-listbox',
    optionIdPrefix: 'category-suggest',
    listboxAriaLabel: '分类候选',
    displayPrefix: '/'
  }
]

export function emptyScope(): SearchScope {
  return { kind: 'none' }
}

export function scopeHasChip(scope: SearchScope): boolean {
  return scope.kind !== 'none'
}

export function scopeToWorkerSlice(scope: SearchScope): { tag: string | null, category: string | null } {
  if (scope.kind === 'tag')
    return { tag: scope.value, category: null }
  if (scope.kind === 'category')
    return { tag: null, category: scope.value }
  return { tag: null, category: null }
}

/** 已选芯片时禁止再输入的前缀键（与 PREFIX_STRATEGIES 对齐） */
export function isBlockedScopePrefixKey(scope: SearchScope, key: string): boolean {
  if (!scopeHasChip(scope))
    return false
  return PREFIX_STRATEGIES.some(s => s.prefixChar === key)
}

/** 无芯片时，原始输入是否处于前缀联想阶段（不触发 Worker） */
export function isRawPrefixPickingPhase(scope: SearchScope, rawKeyword: string): boolean {
  if (scopeHasChip(scope))
    return false
  return PREFIX_STRATEGIES.some(s => rawKeyword.startsWith(s.prefixChar))
}

export function resolveActivePrefixStrategy(
  scope: SearchScope,
  rawKeyword: string
): PrefixStrategy | null {
  if (scopeHasChip(scope))
    return null
  for (const s of PREFIX_STRATEGIES) {
    if (rawKeyword.startsWith(s.prefixChar))
      return s
  }
  return null
}

export function needleAfterPrefixChar(rawKeyword: string): string {
  return rawKeyword.slice(1).trimStart().toLowerCase()
}

export function filterSuggestCandidates(
  candidates: readonly string[],
  needleLower: string,
  limit = SUGGEST_PAGE_SIZE
): string[] {
  if (!needleLower)
    return [...candidates].slice(0, limit)
  return candidates.filter(c => c.toLowerCase().startsWith(needleLower)).slice(0, limit)
}

/** 本轮是否不应调用 Worker（清空 hits、取消 pending） */
export function shouldAbortWorkerRound(scope: SearchScope, kwTrimmed: string): boolean {
  const { tag, category } = scopeToWorkerSlice(scope)
  if (!tag && !category && !kwTrimmed)
    return true
  if (!tag && !category && isRawPrefixPickingPhase(scope, kwTrimmed))
    return true
  return false
}

/** 结果列表区域是否显示「请输入关键字」类 idle 占位 */
export function shouldShowIdlePlaceholder(
  scope: SearchScope,
  kwTrimmed: string,
  rawKeyword: string
): boolean {
  if (scopeHasChip(scope))
    return false
  return !kwTrimmed || isRawPrefixPickingPhase(scope, rawKeyword)
}

export function nextListboxIndex(selectedIndex: number, itemCount: number): number {
  const n = Math.min(selectedIndex + 1, itemCount - 1)
  return n < 0 ? 0 : n
}

export function prevListboxIndex(selectedIndex: number): number {
  return selectedIndex <= 0 ? -1 : selectedIndex - 1
}
