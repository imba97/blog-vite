<template>
  <div
    class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[210] sm:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
    :style="{ right: floatingRightOffset }"
  >
    <div
      class="of-hidden card-soft p-1 backdrop-blur-sm transition-[max-height] duration-250 ease-out"
      :class="showBackToTop ? 'max-h-[92px] sm:max-h-[100px]' : 'max-h-[44px] sm:max-h-[48px]'"
    >
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="size-9 fcc rounded-lg surface-subtle text-gray-700 outline-none transition-colors duration-200 sm:size-10 dark:text-gray-100 hover:text-primary-6 focus-ring-primary dark:hover:text-primary-4"
          :aria-label="themeAriaLabel"
          @click="cycleThemeMode"
        >
          <span class="text-base" :class="[themeIconClass]" />
        </button>

        <button
          type="button"
          class="size-9 fcc rounded-lg surface-subtle text-gray-700 outline-none transition-all duration-200 ease-out sm:size-10 dark:text-gray-100 hover:text-primary-6 focus-ring-primary dark:hover:text-primary-4"
          :class="showBackToTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'"
          aria-label="回到顶部"
          @click="scrollToTop"
        >
          <span class="i-carbon-arrow-up text-base" />
        </button>
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
  showBackToTop.value = window.scrollY > SCROLL_THRESHOLD
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>
