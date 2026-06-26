<template>
  <main
    class="pb-24 transition-colors duration-200"
    @click="handleMainClick"
  >
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
import { tracker } from '~/utils/analytics'
import { isArticlePostRoute, isReadableLayoutRoute, shouldShowTwikooSection } from '~/utils/route-page-kind'
import { navigateSpaOrExternal, shouldDelegateSpaNavigation } from '~/utils/spa-navigation'
import { isExternalUrl } from '~/utils/url'

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
