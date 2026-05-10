<template>
  <header class="sticky left-0 top-0 z-40 border-b border-subtle bg-white/82 shadow-sm backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/92">
    <div class="site-container h-16 flex items-center justify-between gap-5">
      <button type="button" class="fyc shrink-0 gap-4 rounded-lg p-1 transition-opacity hover:opacity-90 focus-ring-primary" aria-label="返回首页" @click="goHome">
        <img src="/assets/images/favicon.png" alt="站点图标" class="size-10 shrink-0 object-cover">
      </button>

      <AnimatePresence>
        <motion.div
          v-if="postsStore.current"
          :key="postsStore.current.title"
          :initial="{ opacity: 0, x: -10 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: -10 }"
          :transition="{ duration: 0.3 }"
          class="max-w-70 truncate text-base text-gray-700 font-medium sm:text-lg dark:text-white/90"
        >
          {{ postsStore.current.title }}
        </motion.div>
      </AnimatePresence>
      <nav class="fyc gap-2 sm:gap-4" aria-label="主导航">
        <AutoLink
          v-for="item in navbar"
          :key="item.link"
          :href="item.link"
          clickable-97
          class="fyc gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors duration-200 sm:gap-2 hover:bg-gray-100/80 sm:px-2.5 dark:text-white/90 hover:text-primary-6 focus-ring-primary dark:hover:bg-white/8 dark:hover:text-white"
        >
          <span :class="item.icon" />
          <span class="hidden sm:inline">{{ item.text }}</span>
        </AutoLink>
      </nav>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { AnimatePresence, motion } from 'motion-v'
import { navbar } from '~/configs/nav'
import { usePostsStore } from '~/store/post'

const router = useRouter()
const postsStore = usePostsStore()

function goHome() {
  router.push('/')
}
</script>
