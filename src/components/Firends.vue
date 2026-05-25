<template>
  <div mt-8 gap-6 grid="~ cols-1 md:cols-2">
    <a
      v-for="item in list"
      :key="item.url"
      :href="item.url"
      target="_blank"
      important="decoration-none"
      class="group block card-hover text-inherit focus-ring-primary"
    >
      <div fcc gap-4 p-6>
        <div size-20 shrink-0>
          <img
            :src="item.avatar"
            size-full
            important="rounded-full m-0 object-cover"
            class="border border-subtle"
          >
        </div>
        <div class="text-center">
          <div class="text-lg list-title list-title-hover font-semibold transition-colors duration-200">
            {{ item.name }}
          </div>
          <div
            v-if="item.description"
            class="mt-1 text-sm text-muted/60 dark:text-muted/50"
          >
            {{ item.description }}
          </div>
        </div>
      </div>
    </a>
  </div>
</template>

<script lang="ts" setup>
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
