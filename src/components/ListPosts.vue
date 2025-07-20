<template>
  <div size-full flex flex-col>
    <ul pl-0 space-y-3 class="[&>li]:(py-2 before:hidden)">
      <li
        v-for="post in paginatedPosts"
        :key="post.path"
        class="list-none border-b border-gray-100 py-3 last:border-b-0 [&_a]:(b-b-none!)"
      >
        <RouterLink :to="post.path" class="block rounded px-2 py-1 transition-colors -mx-2 hover:bg-gray-50">
          <div fbc gap-4>
            <div class="hover:text-primary-600 text-gray-900 transition-colors">
              {{ post.title }}
            </div>
            <div class="shrink-0 text-sm text-gray-400 font-mono">
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
