<template>
  <div size-full flex flex-col>
    <ul pl-0 space-y-2.5 class="[&>li]:(py-0.5 before:hidden)">
      <li
        v-for="post in paginatedPosts"
        :key="post.path"
        class="list-none border-b list-divider py-1.5 last:border-b-0 [&_a]:(b-b-none!)"
      >
        <RouterLink
          :to="post.path"
          class="group block rounded-xl px-3 py-2.5 transition-colors duration-200 -mx-1.5 focus-ring-primary"
          :aria-label="`阅读文章：${post.title}`"
        >
          <article class="min-h-10 space-y-0.5">
            <div class="flex items-start justify-between gap-4 sm:items-center">
              <h2 class="relative m-0 text-lg list-title font-normal leading-snug transition-colors duration-200 sm:text-xl group-hover:text-primary-3 dark:group-hover:text-primary-light">
                <span class="i-carbon-chevron-right pa top-1/2 hidden text-primary-3/70 opacity-0 transition-all duration-200 -left-8 sm:block -translate-x-1 -translate-y-1/2 group-hover:translate-x-0 dark:text-primary-light/70 group-hover:opacity-65" aria-hidden="true" />
                <span>{{ post.title }}</span>
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

    <footer class="mt-25 border-t border-gray-200/70 pt-12.5 text-xs text-soft dark:border-neutral-800/80">
      <p class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 leading-5">
        <a
          class="rounded-sm text-muted decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          :href="commitLink"
          target="_blank"
          rel="noopener"
          :aria-label="`查看构建提交：${buildShortHash}`"
        >
          Build {{ buildShortHash }}
        </a>
        <span aria-hidden="true">·</span>
        <a
          class="rounded-sm text-soft decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          :href="repositoryLink"
          target="_blank"
          rel="noopener"
          aria-label="查看项目仓库"
        >
          Repository
        </a>
        <span aria-hidden="true">·</span>
        <a
          class="rounded-sm text-soft decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en"
          target="_blank"
          rel="noopener"
          aria-label="查看 CC BY-NC-SA 4.0 许可协议"
        >
          CC BY-NC-SA 4.0
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { usePostsStore } from '~/store/post'
import Pagination from './Pagination.vue'

const postsStore = usePostsStore()
const repositoryLink = 'https://github.com/imba97/blog-vite'
const buildShortHash = __GIT_COMMIT_SHORT_HASH__
const buildFullHash = __GIT_COMMIT_HASH__

const commitLink = computed(() => {
  if (buildFullHash === 'unknown') {
    return repositoryLink
  }
  return `${repositoryLink}/commit/${buildFullHash}`
})

const paginatedPosts = computed(() => {
  const start = (postsStore.page - 1) * postsStore.size
  const end = start + postsStore.size
  return postsStore.posts.slice(start, end)
})

function changePage(newPage: number) {
  postsStore.setPage(newPage)
}
</script>
