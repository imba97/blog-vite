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
import { isExternalUrl } from '~/utils/url'

const route = useRoute()
const router = useRouter()

const isListPage = computed(() => route.path === '/' || route.path.startsWith('/page/'))
const isPostPage = computed(() => !isListPage.value)
const shouldShowComments = computed(() => !isListPage.value)

function handleMainClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return
  }

  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) {
    return
  }

  const href = anchor.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('//') || isExternalUrl(href)) {
    return
  }

  event.preventDefault()
  router.push(href)
}
</script>
