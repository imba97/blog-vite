<template>
  <main
    class="transition-colors duration-200"
    :class="[isPostPage ? 'page-container-readable prose prose-shell' : 'page-container']"
  >
    <RouterView />
  </main>
</template>

<script lang="ts" setup>
const route = useRoute()

const isListPage = computed(() => route.path === '/' || route.path.startsWith('/page/'))
const isPostPage = computed(() => !isListPage.value)
</script>
