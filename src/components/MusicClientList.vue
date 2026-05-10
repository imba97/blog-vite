<template>
  <div flex="~ wrap" items-center justify-center gap-8>
    <div v-for="item in list" :key="item.name" class="max-w-xs card text-center">
      <div class="mb-4 text-lg text-primary-6 font-semibold">
        {{ item.name }}
      </div>
      <div class="mb-4 overflow-hidden border border-subtle rounded-xl">
        <img :src="item.image" m-0="!" size-50="!" object-cover>
      </div>
      <div>
        <a
          :href="item.url"
          target="_blank"
          class="inline-flex items-center gap-2 btn-primary"
        >
          <span icon i-material-symbols-download-rounded />
          Github
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const list = [
  {
    name: 'Windows Feishin',
    image: 'https://imba97.cn/uploads/2024/06/navidrome-1.png',
    url: 'https://github.com/jeffvli/feishin'
  },
  {
    name: 'Android Tempo',
    image: 'https://imba97.cn/uploads/2024/06/navidrome-2.png',
    url: 'https://github.com/CappielloAntonio/tempo'
  }
]
</script>
