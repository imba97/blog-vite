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

        <div
          v-if="containerVisible"
          class="min-w-0 fyc gap-2 overflow-hidden"
        >
          <AnimatePresence :on-exit-complete="handleBarExitComplete">
            <motion.div
              v-if="showBar"
              key="post-title-indicator"
              :initial="barMotion.initial"
              :animate="barMotion.animate"
              :exit="barMotion.exit"
              class="h-[34px] w-[5px] shrink-0 rounded-sm bg-primary-2/45 dark:bg-primary-1/35"
            />
          </AnimatePresence>

          <div class="relative h-[30px] min-w-0 overflow-hidden">
            <div
              aria-hidden="true"
              class="invisible max-w-70 truncate text-base font-medium sm:text-lg"
            >
              {{ layoutTitle }}
            </div>

            <AnimatePresence mode="wait" :on-exit-complete="handleTitleExitComplete">
              <motion.div
                v-if="displayedTitle"
                :key="displayedTitleKey"
                :initial="titleMotion.initial"
                :animate="titleAnimate"
                :exit="titleMotion.exit"
                class="absolute inset-y-0 left-0 max-w-70 truncate text-base text-gray-700 font-medium sm:text-lg dark:text-white/90"
              >
                {{ displayedTitle }}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
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
import { useHeaderTitleAnimationState } from '~/composables/useHeaderTitleAnimationState'
import { navbar } from '~/configs/nav'
import { usePostsStore } from '~/store/post'

const router = useRouter()
const postsStore = usePostsStore()

const barMotion = {
  initial: {
    opacity: 0,
    y: 12
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22
    }
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: {
      duration: 0.2
    }
  }
}

const titleMotion = {
  initial: {
    opacity: 0,
    x: 18
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.28
    }
  },
  exit: {
    opacity: 0,
    x: -18,
    transition: {
      duration: 0.22
    }
  }
}

const {
  containerVisible,
  showBar,
  displayedTitle,
  displayedTitleKey,
  layoutTitle,
  titleAnimate,
  handleTitleExitComplete,
  handleBarExitComplete
} = useHeaderTitleAnimationState({
  targetTitle: computed(() => postsStore.current?.title?.trim() || ''),
  targetTitleKey: computed(() => postsStore.current?.path || postsStore.current?.title?.trim() || ''),
  titleMotionAnimate: titleMotion.animate
})

function goHome() {
  router.push('/')
}
</script>
