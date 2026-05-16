<template>
  <div class="min-h-screen site-shell">
    <Header />
    <Main />
    <FloatingActionGroup />
    <SearchDialog v-if="shouldRenderSearchDialog" />
  </div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'
import FloatingActionGroup from '~/components/floating-action-group.vue'
import { useSearchOverlayStore } from '~/store/search-overlay'
import Header from './header.vue'
import Main from './main.vue'

const SearchDialog = defineAsyncComponent(() => import('~/components/SearchDialog.vue'))
const overlay = useSearchOverlayStore()
const hasOpenedSearch = ref(false)

const shouldRenderSearchDialog = computed(() =>
  overlay.isOpen || hasOpenedSearch.value
)

watch(() => overlay.isOpen, (open) => {
  if (open)
    hasOpenedSearch.value = true
})

function handleGlobalSearchShortcut(event: KeyboardEvent) {
  if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey)
    return

  const target = event.target as HTMLElement | null
  if (target) {
    const tag = target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable)
      return
  }

  event.preventDefault()
  overlay.open()
  requestAnimationFrame(() => {
    const searchInput = document.getElementById('site-search-input')
    if (!(searchInput instanceof HTMLInputElement))
      return
    searchInput.focus()
    const caret = searchInput.value.length
    searchInput.setSelectionRange(caret, caret)
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalSearchShortcut, { capture: true })
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalSearchShortcut, { capture: true })
})
</script>
