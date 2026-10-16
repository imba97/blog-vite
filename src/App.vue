<template>
  <Layout />
</template>

<script lang="ts" setup>
import { useHead } from '@unhead/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import Layout from './layouts/index.vue'
import { DEFAULT_FAVICON, getCurrentFavicon } from './utils/seasonal-avatar'
import { buildSiteJsonLd } from './utils/seo/json-ld'
import { createShareMeta } from './utils/seo/share-meta'

const route = useRoute()
const currentFavicon = ref(DEFAULT_FAVICON)

onMounted(() => {
  currentFavicon.value = getCurrentFavicon()
})

// 站点级 JSON-LD（Person + WebSite）全局常驻，与路由无关。
// 文章页还会再追加一份 BlogPosting JSON-LD，由 createShareMeta 生成。
const siteJsonLd = JSON.stringify(buildSiteJsonLd())

const faviconLink = computed(() => ({
  rel: 'icon',
  type: 'image/png',
  href: currentFavicon.value
}))

useHead(computed(() => {
  const meta = createShareMeta({
    path: route.path,
    frontmatter: route.meta.frontmatter as Record<string, unknown> | undefined,
    defaultImage: currentFavicon.value
  })

  return {
    title: meta.title,
    meta: meta.meta,
    // 站点级 JSON-LD 与（文章页）BlogPosting JSON-LD 合并注入
    script: [
      { type: 'application/ld+json', innerHTML: siteJsonLd },
      ...meta.script
    ],
    // favicon + 文章页 canonical / markdown alternate 合并注入
    link: [
      faviconLink.value,
      ...meta.link
    ]
  }
}))
</script>
