<template>
  <ListPosts />
</template>

<script lang="ts" setup>
import { usePostsStore } from '~/store/post'

const route = useRoute()
const postsStore = usePostsStore()

const currentPage = computed(() => {
  const pageParam = (route.params as any).page as string | undefined
  const parsed = pageParam ? Number.parseInt(pageParam, 10) : 1
  return Number.isNaN(parsed) || parsed < 1 ? 1 : parsed
})

watch(currentPage, () => {
  postsStore.setPage(currentPage.value)
}, { immediate: true })
</script>
