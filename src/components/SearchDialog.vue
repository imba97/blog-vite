<style scoped>
.tag-chip {
  transition: background-color 0.35s ease, color 0.35s ease;
  background-color: rgb(243 244 246);
  color: rgb(31 41 55);
}

.tag-chip--primed {
  animation: tag-delete-prime-light 0.45s ease-out forwards;
}

@keyframes tag-delete-prime-light {
  0% {
    background-color: rgb(243 244 246);
  }

  40% {
    background-color: rgb(254 202 202);
  }

  100% {
    background-color: rgb(254 226 226);
  }
}
</style>

<style>
html.dark .tag-chip {
  background-color: rgb(255 255 255 / 0.1);
  color: rgb(243 244 246);
}

html.dark .tag-chip--primed {
  animation: tag-delete-prime-dark 0.45s ease-out forwards;
}

@keyframes tag-delete-prime-dark {
  0% {
    background-color: rgb(255 255 255 / 0.1);
  }

  40% {
    background-color: rgb(248 113 113 / 0.38);
  }

  100% {
    background-color: rgb(239 68 68 / 0.22);
  }
}
</style>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="overlay.isOpen"
        class="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pb-6 pt-[min(12vh,6rem)] backdrop-blur-[2px] sm:items-center sm:pt-6"
        role="presentation"
        @click.self="close"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-2 scale-[0.98] opacity-0"
          enter-to-class="translate-y-0 scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 scale-100 opacity-100"
          leave-to-class="translate-y-2 scale-[0.98] opacity-0"
        >
          <div
            v-if="overlay.isOpen"
            role="dialog"
            aria-modal="true"
            aria-label="站内搜索"
            class="h-[min(72vh,560px)] max-h-[min(72vh,560px)] max-w-xl min-h-0 w-full flex flex-col overflow-hidden border border-subtle rounded-2xl bg-white/88 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/88"
            tabindex="-1"
            @click.stop
          >
            <div class="fbc shrink-0 border-b border-subtle px-3 py-2 sm:px-4">
              <span class="text-sm text-muted">搜索</span>
              <button
                type="button"
                class="chrome-icon-btn p-2 text-gray-600 dark:text-gray-300"
                aria-label="关闭搜索"
                @click="close"
              >
                <span class="i-carbon-close text-lg" />
              </button>
            </div>

            <div class="relative z-40 shrink-0 px-3 pb-2 pt-3 sm:px-4">
              <label class="sr-only" for="site-search-input">搜索关键词</label>
              <div class="relative min-w-0">
                <div
                  class="relative min-w-0 border border-subtle rounded-xl bg-white/90 py-2 pl-3 pr-10 transition-shadow focus-within:border-primary-4 dark:bg-neutral-950/60 focus-within:ring-2 focus-within:ring-primary-4/25 dark:focus-within:border-primary-light dark:focus-within:ring-primary-light/28"
                  role="group"
                  aria-label="搜索条件"
                  @click="onSearchFieldShellClick"
                >
                  <div class="min-w-0 fyc gap-2">
                    <template v-if="scopeTag">
                      <code
                        class="tag-chip max-w-[50%] min-w-0 shrink-0 truncate rounded px-1 py-px text-sm"
                        :class="{ 'tag-chip--primed': tagDeletePrimed }"
                        :title="`#${scopeTag}`"
                      >#{{ scopeTag }}</code>
                    </template>
                    <template v-else-if="scopeCategory">
                      <code
                        class="tag-chip max-w-[50%] min-w-0 shrink-0 truncate rounded px-1 py-px text-sm"
                        :class="{ 'tag-chip--primed': tagDeletePrimed }"
                        :title="`/${scopeCategory}`"
                      >/{{ scopeCategory }}</code>
                    </template>
                    <input
                      id="site-search-input"
                      ref="inputRef"
                      v-model="keywordQuery"
                      type="text"
                      enterkeyhint="search"
                      autocomplete="off"
                      autocorrect="off"
                      spellcheck="false"
                      role="combobox"
                      aria-autocomplete="list"
                      :aria-expanded="showSuggestDropdown"
                      :aria-controls="activeSuggestListboxId"
                      :aria-activedescendant="activeSuggestOptionId"
                      :placeholder="scopeTag ? '输入关键字筛选该标签下的文章…' : scopeCategory ? '输入关键字筛选该分类下的文章…' : '请输入关键字'"
                      class="min-h-6 min-w-0 flex-1 border-0 bg-transparent py-0.5 text-base text-gray-900 outline-none ring-0 dark:text-white/90 placeholder:text-gray-600/35 focus:ring-0 dark:placeholder:text-gray-400/30"
                      @keydown="handleKeywordKeydown"
                    >
                  </div>
                  <button
                    v-show="scopeTag || scopeCategory || keywordQuery.length > 0"
                    type="button"
                    class="absolute right-2 top-1/2 size-[14px] flex shrink-0 items-center justify-center rounded-full bg-black/[0.06] p-0 text-gray-600 leading-none transition-colors -translate-y-1/2 dark:bg-white/[0.08] hover:bg-black/[0.1] dark:text-gray-300 focus-ring-primary dark:hover:bg-white/[0.12]"
                    aria-label="清空搜索条件"
                    @click="clearAll"
                  >
                    <span class="i-carbon-close text-[10px] leading-none op-75" aria-hidden="true" />
                  </button>
                </div>

                <div
                  v-if="activeSuggest"
                  :id="activeSuggest.strategy.listboxId"
                  role="listbox"
                  :aria-label="activeSuggest.strategy.listboxAriaLabel"
                  class="absolute left-0 right-0 top-[calc(100%+0.375rem)] z-50 max-h-48 overflow-y-auto border border-subtle rounded-xl bg-white/98 shadow-lg ring-1 ring-black/5 backdrop-blur-sm divide-y divide-black/5 dark:bg-neutral-950/98 dark:ring-white/10 dark:divide-white/8"
                >
                  <button
                    v-for="(item, i) in activeSuggest.items"
                    :id="`${activeSuggest.strategy.optionIdPrefix}-${i}`"
                    :key="`${activeSuggest.strategy.kind}-${item}`"
                    type="button"
                    role="option"
                    :aria-selected="i === selectedSuggestIndex"
                    class="w-full px-3 py-2.5 text-left text-sm text-gray-800 transition-colors dark:text-white/90"
                    :class="i === selectedSuggestIndex ? 'bg-primary-2/32 dark:bg-primary-light/20' : 'hover:bg-gray-50/90 dark:hover:bg-neutral-900/55'"
                    @mousedown.prevent="applyPrefixChoice(activeSuggest.strategy.kind, item)"
                    @mouseenter="selectedSuggestIndex = i"
                  >
                    <span class="text-muted">{{ activeSuggest.strategy.displayPrefix }}</span>{{ item }}
                  </button>
                </div>
              </div>
            </div>

            <div class="fyc shrink-0 gap-2 px-3 pb-2 sm:px-4">
              <code class="rounded bg-gray-100 px-1.5 py-px text-xs text-muted dark:bg-white/10">#tag</code>
              <code class="rounded bg-gray-100 px-1.5 py-px text-xs text-muted dark:bg-white/10">/categorie</code>
            </div>

            <div class="min-h-0 flex flex-1 flex-col overflow-hidden px-3 pb-3 sm:px-4 sm:pb-4">
              <div
                class="relative min-h-0 flex flex-1 flex-col overflow-hidden border border-subtle rounded-xl bg-gray-50/50 dark:bg-neutral-950/40"
              >
                <div class="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                  <div class="px-2 py-3 sm:px-3">
                    <template v-if="!siteSearchWorkerReady && !siteSearchWorkerError">
                      <div class="flex flex-col items-center justify-center gap-2 py-12 text-muted">
                        <span class="i-carbon-circle-dash animate-spin text-3xl" />
                        <span class="text-sm">正在加载搜索索引…</span>
                      </div>
                    </template>

                    <template v-else-if="siteSearchWorkerError">
                      <div class="flex flex-col items-center gap-2 py-10 text-center text-sm text-red-600 dark:text-red-400">
                        <span class="i-carbon-warning-alt text-3xl" />
                        <span>{{ siteSearchWorkerError }}</span>
                      </div>
                    </template>

                    <template v-else-if="showIdlePlaceholder">
                      <div class="flex flex-col items-center gap-3 py-14 text-sm text-gray-600/30 dark:text-gray-400/26">
                        <span class="i-material-symbols-inbox-rounded text-4xl" aria-hidden="true" />
                        <span>请输入关键字</span>
                      </div>
                    </template>

                    <template v-else-if="pendingSearchVisual">
                      <div class="flex flex-col items-center gap-2 py-14 text-muted">
                        <span class="i-carbon-circle-dash animate-spin text-3xl opacity-70" />
                        <span class="text-sm">等待输入结束或正在检索…</span>
                      </div>
                    </template>

                    <template v-else-if="!hits.length">
                      <div class="flex flex-col items-center gap-3 py-14 text-sm text-gray-600/30 dark:text-gray-400/26">
                        <span class="i-material-symbols-inbox-rounded text-4xl" aria-hidden="true" />
                        <span>未搜索到文章</span>
                      </div>
                    </template>

                    <ul v-else class="flex flex-col gap-1">
                      <li v-for="item in hits" :key="item.path">
                        <AutoLink
                          :href="item.path"
                          class="group search-hit-link focus-ring-primary"
                          @click="close"
                        >
                          <div class="search-hit-title">
                            {{ item.title }}
                          </div>
                          <div v-if="item.date" class="mt-0.5 text-xs text-muted">
                            {{ formatDate(item.date) }}
                          </div>
                          <div class="line-clamp-2 mt-1 text-sm text-muted">
                            {{ item.snippet }}
                          </div>
                        </AutoLink>
                      </li>
                    </ul>
                  </div>
                </div>
                <div
                  class="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[16px] from-gray-50 to-transparent bg-gradient-to-b dark:from-neutral-950"
                  aria-hidden="true"
                />
                <div
                  class="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[16px] from-gray-50 to-transparent bg-gradient-to-t dark:from-neutral-950"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import AutoLink from '~/components/AutoLink.vue'
import {
  siteSearchWorkerError,
  siteSearchWorkerReady
} from '~/composables/site-search-worker'
import { useSiteSearchQuery } from '~/composables/use-site-search-query'
import { useSearchOverlayStore } from '~/store/search-overlay'

const overlay = useSearchOverlayStore()

const {
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
  resetTagDeletePrime
} = useSiteSearchQuery()

function onSearchFieldShellClick(e: MouseEvent) {
  const el = e.target as HTMLElement | null
  if (el?.closest('button'))
    return
  inputRef.value?.focus()
}

function formatDate(iso: string) {
  try {
    return dayjs(iso).format('ll')
  }
  catch {
    return iso
  }
}

function close() {
  overlay.close()
}

watch(() => overlay.isOpen, (open) => {
  if (typeof document === 'undefined')
    return

  if (open) {
    document.body.style.overflow = 'hidden'
    focusKeywordInput()
    onOverlayOpened()
  }
  else {
    document.body.style.overflow = ''
    resetForOverlayClose()
  }
})

onMounted(() => {
  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || !overlay.isOpen)
      return
    e.stopPropagation()
    close()
  }, { capture: true })

  useEventListener(window, 'keydown', (e: KeyboardEvent) => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey)
      return

    const t = e.target as HTMLElement | null
    if (!t)
      return

    const tag = t.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT')
      return
    if (t.isContentEditable)
      return

    e.preventDefault()
    overlay.open()
  }, { capture: true })
})

onUnmounted(() => {
  resetTagDeletePrime()
  if (typeof document !== 'undefined' && overlay.isOpen)
    document.body.style.overflow = ''
})
</script>
