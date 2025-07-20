<template>
  <div sticky left-0 top-0 z-10 h-16 fbc bg-primary-9 bg-opacity-50 px-8 py-4 shadow-md backdrop-blur-md>
    <div fyc gap-4>
      <div fyc gap-4 clickable @click="goHome">
        <img src="/assets/images/favicon.png" alt="favicon" size-12>
      </div>

      <AnimatePresence>
        <motion.div
          v-if="postsStore.current"
          :key="postsStore.current.title"
          :initial="{ opacity: 0, x: -10 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: -10 }"
          :transition="{ duration: 0.3 }"
          class="max-w-60 truncate text-xl text-white text-opacity-90 font-medium"
        >
          {{ postsStore.current.title }}
        </motion.div>
      </AnimatePresence>
    </div>

    <nav fyc gap-6>
      <AutoLink
        v-for="item in navbar"
        :key="item.link"
        :href="item.link"
        clickable-97
        class="hover:text-primary-400 fyc gap-2 text-white text-opacity-90 transition-colors duration-200"
      >
        <span :class="item.icon" />
        <span>{{ item.text }}</span>
      </AutoLink>
    </nav>
  </div>
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
