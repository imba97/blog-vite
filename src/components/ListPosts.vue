<template>
  <div size-full flex flex-col>
    <ul pl-0 space-y-3 class="[&>li]:(py-2 before:hidden)">
      <li
        v-for="post in paginatedPosts"
        :key="post.path"
        class="list-none border-b list-divider py-3 last:border-b-0 [&_a]:(b-b-none!)"
      >
        <RouterLink :to="post.path" class="block rounded list-link-hover px-2 py-1 transition-colors -mx-2">
          <div fbc gap-4>
            <div class="list-title-hover list-title transition-colors">
              {{ post.title }}
            </div>
            <div class="shrink-0 text-sm list-meta font-mono">
              {{ dayjs(post.date).format('YYYY-MM-DD') }}
            </div>
          </div>
        </RouterLink>
      </li>
    </ul>

    <div flex-1>
      <Pagination
        :current-page="postsStore.page"
        :total-pages="postsStore.totalPages"
        @change="changePage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { usePostsStore } from '~/store/post'
import Pagination from './Pagination.vue'

const postsStore = usePostsStore()

const paginatedPosts = computed(() => {
  const start = (postsStore.page - 1) * postsStore.size
  const end = start + postsStore.size
  return postsStore.posts.slice(start, end)
})

function changePage(newPage: number) {
  postsStore.setPage(newPage)
}
</script>
