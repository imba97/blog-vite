<template>
  <div sticky left-0 top-0 z-10 h-16 fbc bg-primary-9 bg-opacity-50 px-8 py-4 shadow-md backdrop-blur-md>
    <div clickable @click="goHome">
      <img src="/assets/images/favicon.png" alt="favicon" size-12>
    </div>

    <nav fyc gap-6>
      <AutoLink
        v-for="item in navbar"
        :key="item.link"
        :href="item.link"
        clickable-97
        class="fyc gap-2 text-white text-opacity-90"
      >
        <span :class="item.icon" />
        <span>{{ item.text }}</span>
      </AutoLink>
    </nav>
  </div>
</template>

<script lang="ts" setup>
import { navbar } from '~/configs/nav'

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>
