<style scoped>
.page-btn {
  --uno: px-3 py-2 rounded pagination-text list-link-hover disabled:opacity-50 disabled:cursor-not-allowed min-w-10 text-center font-medium transition-colors;
}

.page-current {
  --uno: pagination-current;
}

.page-ellipsis {
  --uno: px-2 min-w-10 text-center inline-flex justify-center items-center pagination-ellipsis;
}

.pagination-container {
  --uno: mt-8 fcc gap-2 select-none;
}
</style>

<template>
  <div v-if="totalPages > 1" class="pagination-container">
    <button
      class="page-btn"
      :disabled="currentPage <= 1"
      @click="$emit('change', currentPage - 1)"
    >
      上一页
    </button>

    <template v-for="(page, index) in displayPages" :key="index">
      <button
        v-if="page !== '...'"
        class="page-btn"
        :class="{ 'page-current': page === currentPage }"
        @click="emit('change', page as number)"
      >
        {{ page }}
      </button>
      <span v-else class="page-ellipsis">{{ page }}</span>
    </template>

    <button
      class="page-btn"
      :disabled="currentPage >= totalPages"
      @click="$emit('change', currentPage + 1)"
    >
      下一页
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

// 计算要显示的页码
const displayPages = computed(() => {
  if (props.totalPages <= 7) {
    // 如果总页数不多，全部显示
    return Array.from({ length: props.totalPages }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = []
  const currentPage = props.currentPage
  const totalPages = props.totalPages

  // 始终显示第一页
  pages.push(1)

  if (currentPage <= 4) {
    // 当前页靠近起始页
    pages.push(2, 3, 4, 5) // 修改这里，确保显示第5页
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
