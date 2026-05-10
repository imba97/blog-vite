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
          <div class="text-lg list-title font-semibold transition-colors duration-200 group-hover:text-primary-6 dark:group-hover:text-primary-4">
            {{ item.name }}
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
    avatar: 'https://meethigher.top/blog/images/favicon.ico'
  },
  {
    name: '小码博客',
    url: 'https://blog.hikki.site',
    avatar: 'https://blog.hikki.site/data/img/avatar.jpg'
  },
  {
    name: 'whocarewuのblog',
    url: 'http://blog.whocarewu.cn',
    avatar: 'http://blog.whocarewu.cn/assets/logo-Db1-cTJk.svg'
  },
  {
    name: 'PeterJXL',
    url: 'https://www.peterjxl.com',
    avatar: 'https://image.peterjxl.com/blog/re0.jpg'
  }
]
</script>
