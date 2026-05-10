<template>
  <div
    class="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-[max(20px,calc(env(safe-area-inset-right)+20px),calc((100vw-56rem)/2-70px))] z-[210] sm:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
  >
    <div
      class="of-hidden border border-gray-200 rounded-xl bg-white/90 p-1 shadow-md backdrop-blur-sm transition-[max-height] duration-250 ease-out dark:border-gray-700 dark:bg-black/80"
      :class="showBackToTop ? 'max-h-[92px] sm:max-h-[100px]' : 'max-h-[44px] sm:max-h-[48px]'"
    >
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="size-9 fcc clickable-95 rounded-lg bg-gray-100 text-gray-700 outline-none transition-colors duration-200 sm:size-10 dark:bg-gray-800 hover:bg-gray-200 dark:text-gray-100 focus-visible:outline-2 focus-visible:outline-[#50528ab3] focus-visible:outline-offset-2 focus-visible:outline dark:hover:bg-gray-700"
          :aria-label="themeAriaLabel"
          @click="cycleThemeMode"
        >
          <span class="text-base" :class="[themeIconClass]" />
        </button>

        <button
          type="button"
          class="size-9 fcc clickable-95 rounded-lg bg-gray-100 text-gray-700 outline-none transition-all duration-250 ease-out sm:size-10 dark:bg-gray-800 hover:bg-gray-200 dark:text-gray-100 focus-visible:outline-2 focus-visible:outline-[#50528ab3] focus-visible:outline-offset-2 focus-visible:outline dark:hover:bg-gray-700"
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

const SCROLL_THRESHOLD = 320
const showBackToTop = ref(false)
const { themePreference, cycleThemeMode } = useThemeMode()

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
