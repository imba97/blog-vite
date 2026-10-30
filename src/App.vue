<template>
  <Layout />
</template>

<script lang="ts" setup>
import type { SeoRouteMeta } from './utils/seo/share-meta'
import { useHead } from '@unhead/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { sitePages } from '../.auto-generate/site-pages'
import Layout from './layouts/index.vue'
import { DEFAULT_FAVICON, getCurrentFavicon } from './utils/seasonal-avatar'
import { buildSiteJsonLd, serializeJsonLd } from './utils/seo/json-ld'
import { createShareMeta } from './utils/seo/share-meta'

const route = useRoute()
const currentFavicon = ref(DEFAULT_FAVICON)

onMounted(() => {
  currentFavicon.value = getCurrentFavicon()
})

// 站点级 JSON-LD（Organization + Person + WebSite）全局常驻，与路由无关。
// 文章页还会再追加 BlogPosting / FAQPage，由 createShareMeta 生成。
const siteJsonLd = serializeJsonLd(buildSiteJsonLd())

const faviconLink = computed(() => ({
  rel: 'icon',
  type: 'image/png',
  href: currentFavicon.value
}))

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

// 路由 meta（markdown 路由由 scripts/vite/route-frontmatter.ts 写入）
// 优先，其次补 seo/pages.json（归档 / FAQ 等非 markdown 页面）。
function resolveRouteSeo(): SeoRouteMeta | undefined {
  const fromMeta = route.meta.seo as SeoRouteMeta | undefined
  if (fromMeta)
    return fromMeta
  return sitePages[normalizePath(route.path)]
}

useHead(computed(() => {
  const meta = createShareMeta({
    path: route.path,
    seo: resolveRouteSeo(),
    defaultImage: currentFavicon.value
  })

  return {
    htmlAttrs: { lang: 'zh-CN' },
    title: meta.title,
    meta: meta.meta,
    // 站点级 JSON-LD 与（文章页）BlogPosting、FAQPage 合并注入
    script: [
      { type: 'application/ld+json' as const, innerHTML: siteJsonLd },
      ...meta.script
    ],
    // favicon + canonical / markdown alternate 合并注入
    link: [
      faviconLink.value,
      ...meta.link
    ]
  }
}))
</script>
