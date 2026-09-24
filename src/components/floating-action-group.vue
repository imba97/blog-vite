<style scoped>
.back-to-top-enter-active,
.back-to-top-leave-active {
  transition:
    opacity 0.18s cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.back-to-top-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

.back-to-top-leave-to {
  opacity: 0;
  transform: translateY(7px) scale(0.985);
}

@media (prefers-reduced-motion: reduce) {
  .back-to-top-enter-active,
  .back-to-top-leave-active {
    transition-duration: 0.08s;
  }

  .back-to-top-enter-from,
  .back-to-top-leave-to {
    transform: none;
  }
}
</style>

<template>
  <div
    class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[210] sm:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
    :style="{ right: floatingRightOffset }"
  >
    <div class="overflow-hidden card-soft p-1 backdrop-blur-sm">
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="size-9 fcc rounded-lg surface-subtle text-gray-700 outline-none transition-colors duration-200 sm:size-10 dark:text-gray-100 hover:text-primary-6 focus-ring-primary dark:hover:text-primary-4"
          :aria-label="themeAriaLabel"
          @click="cycleThemeMode"
        >
          <span class="text-base" :class="[themeIconClass]" />
        </button>

        <Transition name="back-to-top">
          <button
            v-if="showBackToTop"
            type="button"
            class="size-9 fcc rounded-lg surface-subtle text-gray-700 outline-none transition-colors duration-200 sm:size-10 dark:text-gray-100 hover:text-primary-6 focus-ring-primary dark:hover:text-primary-4"
            aria-label="回到顶部"
            @click="scrollToTop"
          >
            <span class="i-carbon-arrow-up text-base" />
          </button>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useThemeMode } from '~/composables/use-theme-mode'
import { isPostListRoute } from '~/utils/route-page-kind'

const SCROLL_THRESHOLD = 320
const LIST_PAGE_WIDTH = '64rem'
const POST_PAGE_WIDTH = '56rem'
const BUTTON_SIDE_OFFSET = '70px'
const showBackToTop = ref(false)
const route = useRoute()
const { themePreference, cycleThemeMode } = useThemeMode()
const prefersReducedMotion = usePreferredReducedMotion()
const shouldReduceMotion = computed(() => prefersReducedMotion.value === 'reduce')

const isListPage = computed(() => isPostListRoute(route.path))

const floatingRightOffset = computed(() => {
  const targetWidth = isListPage.value ? LIST_PAGE_WIDTH : POST_PAGE_WIDTH
  return `max(20px, calc(env(safe-area-inset-right) + 20px), calc((100vw - ${targetWidth}) / 2 - ${BUTTON_SIDE_OFFSET}))`
})

const themeIconClass = computed(() => {
  if (themePreference.value === 'dark')
    return 'i-carbon-moon'
  if (themePreference.value === 'light')
    return 'i-carbon-sun'
  return 'i-carbon-laptop'
})

const themeAriaLabel = computed(() => {
  if (themePreference.value === 'dark')
    return '当前黑暗模式，点击切换到明亮模式'
  if (themePreference.value === 'light')
    return '当前明亮模式，点击切换到跟随系统'
  return '当前跟随系统，点击切换到黑暗模式'
})

function updateBackToTopVisibility() {
  const nextVisible = window.scrollY > SCROLL_THRESHOLD
  if (nextVisible === showBackToTop.value)
    return
  showBackToTop.value = nextVisible
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: shouldReduceMotion.value ? 'auto' : 'smooth' })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>
