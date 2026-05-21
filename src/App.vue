<template>
  <Layout />
</template>

<script lang="ts" setup>
import { useHead } from '@unhead/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './layouts/index.vue'
import { createShareMeta } from './utils/seo/share-meta'

const route = useRoute()

useHead(computed(() => createShareMeta({
  path: route.path,
  frontmatter: route.meta.frontmatter as Record<string, unknown> | undefined
})))
</script>
