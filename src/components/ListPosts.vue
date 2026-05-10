<template>
  <div size-full flex flex-col>
    <ul pl-0 space-y-3 class="[&>li]:(py-1 before:hidden)">
      <li
        v-for="post in paginatedPosts"
        :key="post.path"
        class="list-none border-b list-divider py-2 last:border-b-0 [&_a]:(b-b-none!)"
      >
        <RouterLink
          :to="post.path"
          class="group block rounded-xl list-link-hover px-3 py-3 transition-colors -mx-1.5 focus-ring-primary"
          :aria-label="`阅读文章：${post.title}`"
        >
          <article class="min-h-11 space-y-1">
            <div class="flex items-start justify-between gap-4 sm:items-center">
              <h2 class="list-title-hover m-0 text-lg list-title font-semibold leading-snug transition-colors sm:text-xl">
                {{ post.title }}
              </h2>
              <time class="shrink-0 text-xs list-meta tracking-wide font-mono sm:text-sm" :datetime="post.date">
                {{ dayjs(post.date).format('YYYY-MM-DD') }}
              </time>
            </div>
            <slot name="post-extra" :post="post" />
          </article>
        </RouterLink>
      </li>
    </ul>

    <div class="min-w-0 w-full">
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
