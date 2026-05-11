<style scoped>
.page-scroll-wrap {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-scroll-wrap::-webkit-scrollbar {
  display: none;
}

.page-number-btn {
  scroll-snap-align: center;
}
</style>

<template>
  <nav v-if="totalPages > 1" class="mt-5 flex select-none items-center gap-2 sm:justify-center" aria-label="文章分页导航">
    <button
      class="min-h-10 min-w-10 shrink-0 border border-subtle rounded-lg surface-base px-3 py-2 text-center text-sm pagination-nav font-normal transition-colors disabled:pagination-disabled focus-ring-primary"
      :disabled="currentPage <= 1"
      aria-label="上一页"
      @click="$emit('change', currentPage - 1)"
    >
      上一页
    </button>

    <div ref="pageScrollWrapRef" class="page-scroll-wrap [touch-action:pan-x] min-w-0 flex-1 snap-x snap-proximity overflow-x-auto overscroll-x-contain px-1 sm:hidden" aria-label="移动端页码滚动区域">
      <div class="min-w-full inline-flex items-center justify-start gap-2 whitespace-nowrap py-0.5">
        <button
          v-for="page in allPages"
          :key="`mobile-${page}`"
          class="page-number-btn min-h-10 min-w-10 shrink-0 pagination-page rounded-lg px-3 py-2 text-center text-sm font-normal transition-colors focus-ring-primary"
          :class="page === currentPage ? 'pagination-current cursor-default font-normal pointer-events-none' : 'pagination-page-hover'"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`跳转到第 ${page} 页`"
          @click="emit('change', page)"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <div class="hidden items-center justify-center gap-2 py-0.5 sm:flex" aria-label="桌面端页码区域">
      <template v-for="(page, index) in displayPages" :key="`desktop-${page}-${index}`">
        <button
          v-if="page !== '...'"
          class="page-number-btn min-h-10 min-w-10 shrink-0 pagination-page rounded-lg px-3 py-2 text-center text-sm font-normal transition-colors focus-ring-primary"
          :class="page === currentPage ? 'pagination-current cursor-default font-normal pointer-events-none' : 'pagination-page-hover'"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`跳转到第 ${page} 页`"
          @click="emit('change', page as number)"
        >
          {{ page }}
        </button>
        <span v-else class="min-h-11 min-w-11 inline-flex shrink-0 items-center justify-center px-2 text-center pagination-ellipsis" aria-hidden="true">{{ page }}</span>
      </template>
    </div>

    <button
      class="min-h-10 min-w-10 shrink-0 border border-subtle rounded-lg surface-base px-3 py-2 text-center text-sm pagination-nav font-normal transition-colors disabled:pagination-disabled focus-ring-primary"
      :disabled="currentPage >= totalPages"
      aria-label="下一页"
      @click="$emit('change', currentPage + 1)"
    >
      下一页
    </button>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

const pageScrollWrapRef = ref<HTMLElement | null>(null)

const allPages = computed(() =>
  Array.from({ length: props.totalPages }, (_, i) => i + 1)
)

function centerCurrentPageOnMobile() {
  if (typeof window === 'undefined')
    return
  const scrollWrap = pageScrollWrapRef.value
  if (!scrollWrap)
    return
  if (!window.matchMedia('(max-width: 639px)').matches)
    return
  if (scrollWrap.offsetParent === null || !scrollWrap.clientWidth)
    return
  const pageButtons = Array.from(scrollWrap.querySelectorAll('.page-number-btn')) as HTMLElement[]
  if (pageButtons.length < 2)
    return

  const maxScrollLeft = Math.max(0, scrollWrap.scrollWidth - scrollWrap.clientWidth)
  const currentPage = props.currentPage
  const totalPages = props.totalPages
  const visibleWindowSize = 5
  const maxStartPage = Math.max(1, totalPages - visibleWindowSize + 1)
  const desiredStartPage = Math.min(maxStartPage, Math.max(1, currentPage - 2))
  const pageStep = pageButtons[1].offsetLeft - pageButtons[0].offsetLeft
  const targetLeft = Math.min(maxScrollLeft, Math.max(0, (desiredStartPage - 1) * pageStep))
  scrollWrap.scrollTo({ left: targetLeft, behavior: 'auto' })
}

watch(() => props.currentPage, async () => {
  await nextTick()
  requestAnimationFrame(centerCurrentPageOnMobile)
}, { immediate: true })

// 计算要显示的页码
const displayPages = computed(() => {
  if (props.totalPages <= 7) {
    return Array.from({ length: props.totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []
  const currentPage = props.currentPage
  const totalPages = props.totalPages

  // 始终显示第一页
  pages.push(1)

  if (currentPage <= 4) {
    // 当前页靠近起始页
    pages.push(2, 3, 4, 5)
    pages.push('...')
    pages.push(totalPages)
  }
  else if (currentPage >= totalPages - 3) {
    // 当前页靠近结束页
    pages.push('...')
    pages.push(totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
  }
  else {
    // 当前页在中间
    pages.push('...')
    pages.push(currentPage - 1, currentPage, currentPage + 1)
    pages.push('...')
    pages.push(totalPages)
  }

  return pages
})
</script>
