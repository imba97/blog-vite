<template>
  <header class="sticky left-0 top-0 z-40 border-b border-subtle bg-white/90 backdrop-blur-md dark:bg-neutral-900/92">
    <div class="site-container h-16 flex items-center justify-between gap-5">
      <div class="min-w-0 fyc flex-1 gap-2.5">
        <button
          type="button"
          class="chrome-icon-btn fyc shrink-0 gap-4 rounded-lg p-1"
          aria-label="返回首页"
          @click="goHome"
        >
          <img :src="currentFavicon" alt="站点图标" class="size-10 shrink-0 object-cover">
        </button>

        <div
          v-if="containerVisible"
          class="min-w-0 fyc gap-2 overflow-hidden"
        >
          <AnimatePresence>
            <motion.div
              v-if="barVisible"
              key="post-title-bar"
              class="h-[34px] w-[5px] shrink-0 rounded-sm bg-primary-2/45 dark:bg-primary-light/55"
              :initial="headerBarMotion.initial"
              :animate="headerBarMotion.animate"
              :exit="headerBarMotion.exit"
              :on-animation-complete="onBarIntroComplete"
            />
          </AnimatePresence>

          <div class="relative h-[30px] max-w-70 min-w-0 overflow-hidden">
            <div
              aria-hidden="true"
              class="invisible truncate text-base font-medium sm:text-lg"
            >
              {{ layoutTitle }}
            </div>

            <AnimatePresence mode="wait" :on-exit-complete="onTitlePresenceExitComplete">
              <motion.div
                v-if="showTitleMotion"
                :key="presenceTitleKey"
                class="absolute inset-0"
                :initial="headerTitleMotion.initial"
                :animate="headerTitleMotion.animate"
                :exit="headerTitleMotion.exit"
              >
                <HeaderMarqueeTitle
                  :title="presenceTitle"
                  text-class="text-base text-gray-700 font-medium sm:text-lg dark:text-white/90"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
      <div class="fyc shrink-0 gap-1 sm:gap-2">
        <nav class="hidden fyc gap-2 sm:flex sm:gap-4" aria-label="主导航">
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

        <button
          ref="searchButtonRef"
          type="button"
          class="chrome-icon-btn"
          aria-label="打开站内搜索"
          @click="openSearch"
        >
          <span class="i-carbon-search text-base" />
        </button>

        <button
          ref="menuButtonRef"
          type="button"
          class="chrome-icon-btn sm:hidden"
          aria-label="打开导航菜单"
          :aria-expanded="isDrawerOpen"
          aria-controls="mobile-nav-drawer"
          @click="toggleDrawer"
        >
          <span :class="isDrawerOpen ? 'i-carbon-close-large text-base' : 'i-carbon-menu text-base'" />
        </button>
      </div>
    </div>
  </header>

  <MobileNavDrawer v-model="isDrawerOpen" />
</template>

<script lang="ts" setup>
import { AnimatePresence, motion } from 'motion-v'
import MobileNavDrawer from '~/components/mobile-nav-drawer.vue'
import { useHeaderTitleAnimationState } from '~/composables/useHeaderTitleAnimationState'
import { navbar } from '~/configs/nav'
import { useMobileNavDrawerReturnFocusBus } from '~/event-bus/mobile-nav'
import { usePostsStore } from '~/store/post'
import { useSearchOverlayStore } from '~/store/search-overlay'
import { isArticlePostRoute } from '~/utils/route-page-kind'
import { getCurrentFavicon } from '~/utils/seasonal-avatar'

const router = useRouter()
const route = useRoute()
const postsStore = usePostsStore()
const searchOverlay = useSearchOverlayStore()
const isPostPage = computed(() => isArticlePostRoute(route.path))
const currentFavicon = computed(() => getCurrentFavicon())
const isDrawerOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const searchButtonRef = ref<HTMLButtonElement | null>(null)

const returnFocusBus = useMobileNavDrawerReturnFocusBus()
returnFocusBus.on(() => {
  menuButtonRef.value?.focus()
})

const {
  containerVisible,
  layoutTitle,
  barVisible,
  showTitleMotion,
  presenceTitleKey,
  presenceTitle,
  headerBarMotion,
  headerTitleMotion,
  onBarIntroComplete,
  onTitlePresenceExitComplete
} = useHeaderTitleAnimationState({
  targetTitle: computed(() => postsStore.current?.title?.trim() || ''),
  targetTitleKey: computed(() => postsStore.current?.path || postsStore.current?.title?.trim() || '')
})

function goHome() {
  if (isPostPage.value) {
    const canGoBack = typeof window !== 'undefined' && Boolean(window.history.state?.back)
    if (canGoBack) {
      router.back()
      return
    }
  }
  router.push('/')
}

function openSearch() {
  searchOverlay.open()
}

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
}
</script>
