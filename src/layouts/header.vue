<template>
  <header class="sticky left-0 top-0 z-40 border-b border-subtle bg-white/90 backdrop-blur-md dark:bg-neutral-900/92">
    <div class="site-container h-16 flex items-center justify-between gap-5">
      <div class="min-w-0 fyc flex-1 gap-2.5">
        <button
          type="button"
          class="fyc shrink-0 gap-4 rounded-lg interactive-soft p-1 text-gray-700 transition-colors duration-200 dark:text-gray-200 hover:text-primary-6 focus-ring-primary dark:hover:text-primary-4"
          aria-label="返回首页"
          @click="goHome"
        >
          <img src="/assets/images/favicon.png" alt="站点图标" class="size-10 shrink-0 object-cover">
        </button>

        <AnimatePresence mode="wait">
          <motion.div
            v-if="postsStore.current"
            :key="postsStore.current.title"
            class="min-w-0 fyc gap-2 overflow-hidden"
          >
            <motion.div
              :initial="{ scaleY: 0, opacity: 0.5, originY: 1 }"
              :animate="{
                scaleY: 1,
                opacity: 1,
                originY: 1,
                transition: {
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1]
                }
              }"
              :exit="{
                scaleY: 0,
                opacity: 0.6,
                originY: 1,
                transition: {
                  duration: 0.16,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1]
                }
              }"
              class="h-[34px] w-[5px] shrink-0 rounded-sm bg-primary-2/45 dark:bg-primary-1/35"
            />
            <motion.div
              :initial="{ opacity: 0, x: -12 }"
              :animate="{
                opacity: 1,
                x: 0,
                transition: {
                  duration: 0.26,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.14
                }
              }"
              :exit="{
                opacity: 0,
                x: -14,
                transition: {
                  duration: 0.18,
                  ease: [0.22, 1, 0.36, 1]
                }
              }"
              class="max-w-70 truncate text-base text-gray-700 font-medium sm:text-lg dark:text-white/90"
            >
              {{ postsStore.current.title }}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
      <nav class="fyc gap-2 sm:gap-4" aria-label="主导航">
        <AutoLink
          v-for="item in navbar"
          :key="item.link"
          :href="item.link"
          clickable-100
          class="nav-link focus-ring-primary"
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
