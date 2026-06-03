<template>
  <Layout />
</template>

<script lang="ts" setup>
import { useHead } from '@unhead/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './layouts/index.vue'
import { DEFAULT_FAVICON, getCurrentFavicon } from './utils/seasonal-avatar'
import { createShareMeta } from './utils/seo/share-meta'

const route = useRoute()
const currentFavicon = ref(DEFAULT_FAVICON)

onMounted(() => {
  currentFavicon.value = getCurrentFavicon()
})

useHead(computed(() => ({
  ...createShareMeta({
    path: route.path,
    frontmatter: route.meta.frontmatter as Record<string, unknown> | undefined,
    defaultImage: currentFavicon.value
  }),
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: currentFavicon.value
    }
  ]
})))
</script>
