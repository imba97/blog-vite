<template>
  <div mt-8 gap-6 grid="~ cols-1 md:cols-2">
    <AutoLink
      v-for="item in list"
      :key="item.url"
      :href="item.url"
      important="decoration-none"
      :aria-label="`访问友链：${item.name}`"
      class="group block text-inherit b-b-none! focus-ring-primary hover:b-b-none!"
    >
      <div class="h-28 flex items-center gap-4 border border-subtle rounded-xl surface-base p-4 transition-colors duration-200 group-hover:bg-gray-50 dark:group-hover:bg-neutral-800/65">
        <div class="relative size-16 shrink-0 overflow-hidden border border-subtle rounded-full bg-gray-100 dark:bg-neutral-800/80">
          <img
            v-if="!failedAvatars[item.url]"
            :src="item.avatar"
            :alt="`${item.name} avatar`"
            size-full
            important="rounded-full m-0 object-cover"
            @error="handleAvatarError(item.url)"
          >
          <div
            v-else
            class="size-full fcc text-gray-500 dark:text-gray-400"
            aria-hidden="true"
          >
            <span class="i-carbon-user-filled text-xl" />
          </div>
        </div>
        <div class="min-w-0 flex flex-1 flex-col justify-center gap-0.5 text-left">
          <div class="truncate text-base list-title font-semibold leading-snug transition-colors duration-200 sm:text-lg group-hover:text-primary-6 dark:group-hover:text-primary-light">
            {{ item.name }}
          </div>
          <div
            v-if="item.description"
            class="line-clamp-2 text-sm text-muted/48 leading-relaxed dark:text-gray-100/50"
          >
            {{ item.description }}
          </div>
          <div class="truncate text-xs text-muted/30 tracking-wide dark:text-muted/35">
            {{ extractHost(item.url) }}
          </div>
        </div>
        <span class="i-carbon-arrow-up-right shrink-0 text-gray-400 opacity-0 transition-all duration-200 -translate-x-0.5 group-hover:translate-x-0 dark:text-gray-500 group-hover:opacity-80" aria-hidden="true" />
      </div>
    </AutoLink>
  </div>
</template>

<script lang="ts" setup>
import AutoLink from '~/components/AutoLink.vue'

const failedAvatars = ref<Record<string, boolean>>({})

function handleAvatarError(url: string) {
  failedAvatars.value[url] = true
}

function extractHost(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, '')
  }
  catch {
    return url
  }
}

const list = [
  {
    name: '易姐的博客',
    url: 'https://shakaianee.top',
    avatar: 'https://gravatar.loli.net/avatar/0bf16c751d119f1fb5e76d2bdef47fd4'
  },
  {
    name: '言成言成啊',
    url: 'https://meethigher.top/blog',
    avatar: 'https://meethigher.top/blog/images/favicon.ico',
    description: '相遇在更高处'
  },
  {
    name: '小码博客',
    url: 'https://blog.hikki.site',
    avatar: 'https://blog.hikki.site/data/img/avatar.jpg',
    description: '喜欢的东西就努力去追求，万一成功了呢！'
  },
  {
    name: 'whocarewuのblog',
    url: 'http://blog.whocarewu.cn',
    avatar: 'http://blog.whocarewu.cn/assets/logo-Db1-cTJk.svg'
  },
  {
    name: 'PeterJXL',
    url: 'https://www.peterjxl.com',
    avatar: 'https://image.peterjxl.com/blog/re0.jpg',
    description: '从 01 开始'
  },
  {
    name: 'imxizhen',
    url: 'https://www.imxizhen.cn',
    avatar: 'https://q1.qlogo.cn/g?b=qq&nk=89525295&s=640',
    description: '永远相信美好的事情即将发生'
  },
  {
    name: 'ZMTU',
    url: 'https://zmtu.com',
    avatar: 'https://zmtu.com/static/images/app/App_Logo.png',
    description: 'ACG二次元社区，我们的征途是星辰大海！'
  },
  {
    name: 'UpXuu’s blog',
    url: 'https://upxuu.com',
    avatar: 'https://upxuu.com/images/20260214145619.jpg',
    description: '逐光而上'
  }
]
</script>
