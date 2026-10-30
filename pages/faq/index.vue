<template>
  <div class="space-y-8">
    <p class="text-base text-muted leading-7">
      关于这个博客最常被问到的几个问题：写什么、怎么搭的、能不能转载、怎么联系。
      如果这里没有你要的答案，直接发邮件即可。
    </p>

    <section
      v-for="item in siteFaq"
      :key="item.question"
      class="space-y-2"
    >
      <h2 class="text-lg text-gray-800 font-semibold dark:text-gray-100">
        {{ item.question }}
      </h2>
      <p class="leading-7">
        {{ item.answer }}
      </p>
    </section>

    <p class="border-t border-gray-200/70 pt-6 text-sm text-muted leading-6 dark:border-neutral-800/80">
      还有别的问题？发邮件到
      <a
        v-if="contactEmail"
        :href="`mailto:${contactEmail}`"
        class="text-primary-6 dark:text-primary-light hover:underline"
      >{{ contactEmail }}</a>
      <span v-else>站长邮箱</span>
      ，或者到
      <a
        href="https://github.com/imba97"
        target="_blank"
        rel="noopener"
        class="text-primary-6 dark:text-primary-light hover:underline"
      >GitHub</a>
      留言。
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '@unhead/vue'
import { siteFaq } from '../../.auto-generate/site-faq'
import { siteSeo } from '../../.auto-generate/site-seo'
import { buildFaqJsonLd, serializeJsonLd } from '../../src/utils/seo/json-ld'

const contactEmail = siteSeo.contact?.email ?? siteSeo.author.email
const faqJsonLd = serializeJsonLd(buildFaqJsonLd({
  path: '/faq',
  items: siteFaq,
  name: `${siteSeo.name} 常见问题`
}))

// FAQPage 结构化数据只在这个页面注入；页面内容与 JSON-LD 同源（seo/site.json）
useHead({
  script: [
    { type: 'application/ld+json' as const, innerHTML: faqJsonLd }
  ]
})
</script>
