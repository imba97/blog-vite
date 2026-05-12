<template>
  <main
    class="pb-24 transition-colors duration-200"
    @click="handleMainClick"
  >
    <section :class="[isPostPage ? 'page-container-readable prose prose-shell' : 'page-container']">
      <RouterView />
    </section>
    <section v-if="shouldShowComments" class="page-container-readable rounded-2xl bg-gray-200/30 px-4 py-5 dark:bg-neutral-900/45 sm:px-6">
      <Twikoo :key="route.path" :route-path="route.path" />
    </section>
  </main>
</template>

<script lang="ts" setup>
import { isReadableLayoutRoute, shouldShowTwikooSection } from '~/utils/route-page-kind'
import { navigateSpaOrExternal, shouldDelegateSpaNavigation } from '~/utils/spa-navigation'

const route = useRoute()
const router = useRouter()

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
</script>
