<template>
  <main
    class="pb-24 transition-colors duration-200"
    @click="handleMainClick"
  >
    <!-- 要点区块刻意放在正文容器之外：只读侧车元数据（seo/posts/<id>.json），
         不改动文章本身的 markdown 内容与结构 -->
    <aside
      v-if="isArticlePage && articleKeyPoints.length > 0"
      class="page-container-readable pt-8"
      aria-labelledby="article-key-points-title"
    >
      <div class="rounded-xl border border-gray-200/70 bg-gray-100/50 px-4 py-4 dark:border-neutral-800/80 dark:bg-neutral-900/40 sm:px-5">
        <h2
          id="article-key-points-title"
          class="m-0 text-sm font-semibold tracking-wide text-muted"
        >
          本文要点
        </h2>
        <ul class="mb-0 mt-2 space-y-1.5 pl-5 text-sm leading-6">
          <li
            v-for="point in articleKeyPoints"
            :key="point"
            class="list-disc"
          >
            {{ point }}
          </li>
        </ul>
      </div>
    </aside>

    <section
      :class="[isPostPage ? 'page-container-readable prose prose-shell' : 'page-container', { 'prose-shell--article': isArticlePage }]"
    >
      <div
        v-if="isArticlePage && !articleReady"
        class="min-h-40 fcc py-20 text-muted"
        aria-label="文章加载中"
      >
        <span class="i-eos-icons-loading animate-spin text-xl" aria-hidden="true" />
      </div>
      <RouterView v-else />
    </section>

    <!-- 文章 FAQ 同样独立于正文，数据来自侧车元数据 -->
    <aside
      v-if="isArticlePage && articleFaq.length > 0"
      class="page-container-readable mt-10"
      aria-labelledby="article-faq-title"
    >
      <h2
        id="article-faq-title"
        class="text-lg font-semibold text-gray-800 dark:text-gray-100"
      >
        常见问题
      </h2>
      <div
        v-for="item in articleFaq"
        :key="item.question"
        class="mt-4 space-y-1.5"
      >
        <h3 class="m-0 text-base font-medium text-gray-800 dark:text-gray-100">
          {{ item.question }}
        </h3>
        <p class="m-0 text-sm leading-7 text-gray-700 dark:text-gray-300">
          {{ item.answer }}
        </p>
      </div>
    </aside>

    <section
      v-if="shouldShowComments"
      ref="commentsShellRef"
      class="page-container-readable rounded-2xl bg-gray-200/30 px-4 py-5 dark:bg-neutral-900/45 sm:px-6"
    >
      <Twikoo v-if="shouldMountComments" :key="route.path" :route-path="route.path" />
      <div v-else class="fyc gap-2 py-4 text-sm text-muted">
        <span class="i-carbon-circle-dash animate-spin text-base opacity-70" />
        <span>评论区域将在可见后加载…</span>
      </div>
    </section>
    <PostImageViewer
      v-model:show="postImageViewerShow"
      v-model:active-index="postImageViewerActiveIndex"
      :images="postImageViewerImages"
    />
  </main>
</template>

<script lang="ts" setup>
import PostImageViewer from '~/components/PostImageViewer.vue'
import { useArticleStyles } from '~/composables/use-article-styles'
import { usePostImageViewer } from '~/composables/use-post-image-viewer'
import type { SeoRouteMeta } from '~/utils/seo/share-meta'
import { tracker } from '~/utils/analytics'
import { isArticlePostRoute, isReadableLayoutRoute, shouldShowTwikooSection } from '~/utils/route-page-kind'
import { navigateSpaOrExternal, shouldDelegateSpaNavigation } from '~/utils/spa-navigation'
import { isExternalUrl } from '~/utils/url'

// 显式异步引入（覆盖 unplugin-vue-components 的静态 auto-import），
// 否则 Twikoo 及其 manualChunks 的 comments chunk 会成为入口的静态依赖，
// 在每个页面首屏被 modulepreload 全量下载（约 1MB raw）
const Twikoo = defineAsyncComponent(() => import('~/components/Twikoo.vue'))

const route = useRoute()
const router = useRouter()
const commentsShellRef = ref<HTMLElement | null>(null)
const shouldMountComments = ref(false)
let commentsObserver: IntersectionObserver | null = null

// 仅在进入文章详情页时按需加载文章专属 CSS，缩短首屏关键链
const { ready: articleReady } = useArticleStyles()
const {
  show: postImageViewerShow,
  images: postImageViewerImages,
  activeIndex: postImageViewerActiveIndex,
  reset: resetPostImageViewer
} = usePostImageViewer()

const isPostPage = computed(() => isReadableLayoutRoute(route.path))
const isArticlePage = computed(() => isArticlePostRoute(route.path))
const shouldShowComments = computed(() => shouldShowTwikooSection(route.path))

// 要点与 FAQ 只从侧车元数据读取（route-frontmatter 写进 meta），
// 渲染在正文容器之外，文章的 markdown 内容保持原样。
const routeSeo = computed(() => route.meta.seo as SeoRouteMeta | undefined)
const articleKeyPoints = computed(() => routeSeo.value?.keyPoints ?? [])
const articleFaq = computed(() => routeSeo.value?.faq ?? [])

function handleMainClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor)
    return

  const href = anchor.getAttribute('href')
  if (!href)
    return

  if (isExternalUrl(href)) {
    if (
      !event.defaultPrevented
      && event.button === 0
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
    ) {
      tracker.outboundClick({ url: href })
    }
    return
  }

  if (!shouldDelegateSpaNavigation(event, anchor, href))
    return

  event.preventDefault()
  navigateSpaOrExternal(router, href)
}

function disposeCommentsObserver() {
  commentsObserver?.disconnect()
  commentsObserver = null
}

function setupCommentsObserver() {
  disposeCommentsObserver()
  if (typeof window === 'undefined' || !shouldShowComments.value || shouldMountComments.value)
    return

  const target = commentsShellRef.value
  if (!target)
    return

  if (!('IntersectionObserver' in window)) {
    shouldMountComments.value = true
    return
  }

  commentsObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      shouldMountComments.value = true
      disposeCommentsObserver()
    }
  }, {
    root: null,
    rootMargin: '220px 0px',
    threshold: 0.01
  })
  commentsObserver.observe(target)
}

watch(
  () => route.path,
  () => {
    resetPostImageViewer()
    shouldMountComments.value = false
    nextTick(() => {
      setupCommentsObserver()
    })
  },
  { immediate: true }
)

watch(shouldShowComments, () => {
  if (!shouldShowComments.value) {
    shouldMountComments.value = false
    disposeCommentsObserver()
    return
  }

  nextTick(() => {
    setupCommentsObserver()
  })
})

onUnmounted(() => {
  disposeCommentsObserver()
  resetPostImageViewer()
})
</script>
