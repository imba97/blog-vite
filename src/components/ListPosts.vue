<style scoped>
.post-list-enter-active,
.post-list-leave-active {
  transition:
    opacity 0.2s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.post-list-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.post-list-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .post-list-enter-active,
  .post-list-leave-active {
    transition-duration: 0.08s;
  }

  .post-list-enter-from,
  .post-list-leave-to {
    transform: none;
  }
}
</style>

<template>
  <div size-full flex flex-col>
    <Transition mode="out-in" name="post-list">
      <ul
        :key="`post-list-page-${postsStore.page}`"
        pl-0
        space-y-2.5
        class="[&>li]:(py-0.5 before:hidden)"
      >
        <li
          v-for="post in paginatedPosts"
          :key="post.path"
          class="list-none border-b list-divider py-1.5 last:border-b-0 [&_a]:(b-b-none!)"
        >
          <RouterLink
            :to="post.path"
            class="group block rounded-xl px-3 py-2.5 transition-colors duration-200 -mx-1.5 focus-ring-primary"
            :aria-label="`阅读文章：${post.title}`"
            @click="trackArticleClickFromList(post)"
          >
            <article class="min-h-10 space-y-0.5">
              <div class="flex items-start justify-between gap-4 sm:items-center">
                <h2 class="relative m-0 text-lg list-title font-normal leading-snug transition-colors duration-200 sm:text-xl group-hover:text-primary-3 dark:group-hover:text-primary-light">
                  <span class="i-carbon-chevron-right pa top-1/2 hidden text-primary-3/70 opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] -left-8 sm:block -translate-x-1 -translate-y-1/2 group-hover:translate-x-0 dark:text-primary-light/70 group-hover:opacity-65" aria-hidden="true" />
                  <span>{{ post.title }}</span>
                </h2>
                <time class="shrink-0 text-xs list-meta tracking-wide font-mono sm:text-sm" :datetime="post.date">
                  {{ formatPostDateYmdInShanghai(post.date) }}
                </time>
              </div>
              <slot name="post-extra" :post="post" />
            </article>
          </RouterLink>
        </li>
      </ul>
    </Transition>

    <div class="min-w-0 w-full">
      <Pagination
        :current-page="postsStore.page"
        :total-pages="postsStore.totalPages"
        @change="changePage"
      />
    </div>

    <footer class="mt-25 border-t border-gray-200/70 pt-12.5 text-xs text-soft dark:border-neutral-800/80">
      <p class="m-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 leading-5">
        <AutoLink
          class="rounded-sm text-muted decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          :href="commitLink"
          :aria-label="`查看构建提交：${buildShortHash}`"
        >
          Build {{ buildShortHash }}
        </AutoLink>
        <span aria-hidden="true">·</span>
        <AutoLink
          class="rounded-sm text-soft decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          :href="repositoryLink"
          aria-label="查看项目仓库"
        >
          Repository
        </AutoLink>
        <span aria-hidden="true">·</span>
        <AutoLink
          class="rounded-sm text-soft decoration-transparent transition-colors duration-200 hover:text-primary-6 hover:underline hover:decoration-current focus-ring-primary dark:hover:text-primary-light"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en"
          aria-label="查看 CC BY-NC-SA 4.0 许可协议"
        >
          CC BY-NC-SA 4.0
        </AutoLink>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AutoLink from '~/components/AutoLink.vue'
import { formatPostDateYmdInShanghai } from '~/content/post-date'
import { usePostsStore } from '~/store/post'
import { tracker } from '~/utils/analytics'
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

function trackArticleClickFromList(post: { path: string, title: string }) {
  tracker.postClick({
    post_path: post.path,
    post_title: post.title,
    source: 'list'
  })
}
</script>
