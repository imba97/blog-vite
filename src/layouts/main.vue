<template>
  <main
    class="pb-24 transition-colors duration-200"
    @click="handleMainClick"
  >
    <section :class="[isPostPage ? 'page-container-readable prose prose-shell' : 'page-container']">
      <RouterView />
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
  </main>
</template>

<script lang="ts" setup>
import { isReadableLayoutRoute, shouldShowTwikooSection } from '~/utils/route-page-kind'
import { navigateSpaOrExternal, shouldDelegateSpaNavigation } from '~/utils/spa-navigation'

const route = useRoute()
const router = useRouter()
const commentsShellRef = ref<HTMLElement | null>(null)
const shouldMountComments = ref(false)
let commentsObserver: IntersectionObserver | null = null

const isPostPage = computed(() => isReadableLayoutRoute(route.path))
const shouldShowComments = computed(() => shouldShowTwikooSection(route.path))

function handleMainClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor)
    return

  const href = anchor.getAttribute('href')
  if (!href)
    return

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
})
</script>
