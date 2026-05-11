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
              class="h-[34px] w-[5px] shrink-0 rounded-sm bg-primary-2/45 dark:bg-primary-light/35"
            />
          </AnimatePresence>

          <div class="relative h-[30px] max-w-70 min-w-0 overflow-hidden">
            <div
              aria-hidden="true"
              class="invisible truncate text-base font-medium sm:text-lg"
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
                class="absolute inset-0"
              >
                <HeaderMarqueeTitle
                  :title="displayedTitle"
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

  <Transition
    enter-active-class="transition-opacity duration-250 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <button
      v-if="isDrawerOpen"
      type="button"
      class="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] sm:hidden"
      aria-label="关闭导航抽屉"
      @click="closeDrawer"
    />
  </Transition>

  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-220 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="isDrawerOpen"
      id="mobile-nav-drawer"
      ref="drawerRef"
      role="dialog"
      aria-modal="true"
      aria-label="移动端导航抽屉"
      tabindex="-1"
      class="fixed right-0 top-0 z-[91] h-full w-[min(82vw,18rem)] border-l border-subtle surface-base shadow-2xl sm:hidden"
    >
      <div class="h-16 fbc border-b border-subtle px-4">
        <span class="text-sm text-muted">导航</span>
        <button
          type="button"
          class="chrome-icon-btn"
          aria-label="关闭导航菜单"
          @click="closeDrawer"
        >
          <span class="i-carbon-close-large text-base" />
        </button>
      </div>

      <nav class="flex flex-col gap-1.5 p-3" aria-label="移动端主导航">
        <AutoLink
          v-for="item in navbar"
          :key="`mobile-${item.link}`"
          :href="item.link"
          clickable-100
          class="w-full nav-link justify-start"
          @click="closeDrawer"
        >
          <span :class="item.icon" />
          <span>{{ item.text }}</span>
        </AutoLink>
      </nav>
    </aside>
  </Transition>
</template>

<script lang="ts" setup>
import { AnimatePresence, motion } from 'motion-v'
import { useHeaderTitleAnimationState } from '~/composables/useHeaderTitleAnimationState'
import { navbar } from '~/configs/nav'
import { usePostsStore } from '~/store/post'
import { useSearchOverlayStore } from '~/store/search-overlay'

const router = useRouter()
const route = useRoute()
const postsStore = usePostsStore()
const searchOverlay = useSearchOverlayStore()
const isPostPage = computed(() => route.path.startsWith('/posts/'))
const isDrawerOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const searchButtonRef = ref<HTMLButtonElement | null>(null)
const drawerRef = ref<HTMLElement | null>(null)

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

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

watch(() => route.fullPath, () => {
  closeDrawer()
})

watch(isDrawerOpen, (opened) => {
  if (typeof document === 'undefined')
    return
  document.body.style.overflow = opened ? 'hidden' : ''

  if (opened) {
    nextTick(() => {
      focusFirstDrawerElement()
    })
    return
  }

  nextTick(() => {
    menuButtonRef.value?.focus()
  })
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

function closeDrawer() {
  isDrawerOpen.value = false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDrawer()
    return
  }

  if (event.key === 'Tab' && isDrawerOpen.value)
    trapDrawerFocus(event)
}

function getDrawerFocusableElements() {
  const drawer = drawerRef.value
  if (!drawer)
    return []

  return Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1)
}

function focusFirstDrawerElement() {
  const drawer = drawerRef.value
  if (!drawer)
    return

  const [firstElement] = getDrawerFocusableElements()
  ;(firstElement || drawer).focus()
}

function trapDrawerFocus(event: KeyboardEvent) {
  const drawer = drawerRef.value
  if (!drawer)
    return

  const focusableElements = getDrawerFocusableElements()
  if (!focusableElements.length) {
    event.preventDefault()
    drawer.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement as HTMLElement | null
  const activeInDrawer = activeElement ? drawer.contains(activeElement) : false

  if (event.shiftKey) {
    if (!activeInDrawer || activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
    return
  }

  if (!activeInDrawer || activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  if (typeof document !== 'undefined')
    document.body.style.overflow = ''
})
</script>
