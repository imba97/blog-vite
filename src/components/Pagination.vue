<style scoped>
.pagination-container {
  --uno: mt-5 flex items-center gap-2 select-none sm:justify-center;
}

.page-nav-btn {
  --uno: shrink-0 min-h-10 min-w-10 rounded-lg px-3 py-2 text-center text-sm font-normal pagination-nav surface-base border border-subtle interactive-soft focus-ring-primary disabled:pagination-disabled transition-colors;
}

.page-scroll-wrap {
  --uno: min-w-0 flex-1 overflow-x-auto overscroll-x-contain px-1 sm:hidden;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  touch-action: pan-x;
  -ms-overflow-style: none;
}

.page-scroll-wrap::-webkit-scrollbar {
  display: none;
}

.page-scroll-track {
  --uno: inline-flex min-w-full items-center justify-start gap-2 py-0.5 whitespace-nowrap;
}

.page-number-btn {
  --uno: min-h-10 min-w-10 shrink-0 rounded-lg px-3 py-2 text-center text-sm font-normal pagination-page focus-ring-primary transition-colors;
  scroll-snap-align: center;
}

.page-current {
  --uno: pagination-current font-normal pointer-events-none;
}

.page-ellipsis {
  --uno: inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center px-2 text-center pagination-ellipsis;
}

.page-desktop-track {
  --uno: hidden items-center justify-center gap-2 py-0.5 sm:flex;
}
</style>

<template>
  <nav v-if="totalPages > 1" class="pagination-container" aria-label="文章分页导航">
    <button
      class="page-nav-btn"
      :disabled="currentPage <= 1"
      aria-label="上一页"
      @click="$emit('change', currentPage - 1)"
    >
      上一页
    </button>

    <div ref="pageScrollWrapRef" class="page-scroll-wrap" aria-label="移动端页码滚动区域">
      <div class="page-scroll-track">
        <button
          v-for="page in allPages"
          :key="`mobile-${page}`"
          class="page-number-btn"
          :class="{ 'page-current': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`跳转到第 ${page} 页`"
          @click="emit('change', page)"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <div class="page-desktop-track" aria-label="桌面端页码区域">
      <template v-for="(page, index) in displayPages" :key="`desktop-${page}-${index}`">
        <button
          v-if="page !== '...'"
          class="page-number-btn"
          :class="{ 'page-current': page === currentPage }"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`跳转到第 ${page} 页`"
          @click="emit('change', page as number)"
        >
          {{ page }}
        </button>
        <span v-else class="page-ellipsis" aria-hidden="true">{{ page }}</span>
      </template>
    </div>

    <button
      class="page-nav-btn"
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
  const currentButton = scrollWrap.querySelector('[aria-current="page"]') as HTMLElement | null
  if (!currentButton)
    return
  const nextLeft = currentButton.offsetLeft - (scrollWrap.clientWidth - currentButton.clientWidth) / 2
  scrollWrap.scrollLeft = Math.max(0, nextLeft)
}

watch(() => props.currentPage, async () => {
  await nextTick()
  centerCurrentPageOnMobile()
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
