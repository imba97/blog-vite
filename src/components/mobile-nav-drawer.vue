<template>
  <AnimatePresence>
    <motion.button
      v-if="open"
      key="mobile-drawer-overlay"
      type="button"
      class="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] sm:hidden"
      :initial="overlayMotion.initial"
      :animate="overlayMotion.animate"
      :exit="overlayMotion.exit"
      :transition="overlayMotion.transition"
      aria-label="关闭导航抽屉"
      @click="close"
    />
  </AnimatePresence>

  <AnimatePresence>
    <motion.aside
      v-if="open"
      id="mobile-nav-drawer"
      key="mobile-drawer-panel"
      ref="drawerRef"
      role="dialog"
      aria-modal="true"
      aria-label="移动端导航抽屉"
      tabindex="-1"
      class="fixed right-0 top-0 z-[91] h-full w-[min(82vw,18rem)] border-l border-subtle surface-base shadow-2xl sm:hidden"
      :initial="panelMotion.initial"
      :animate="panelMotion.animate"
      :exit="panelMotion.exit"
      :transition="panelMotion.transition"
    >
      <div class="h-16 fbc border-b border-subtle px-4">
        <span class="text-sm text-muted">导航</span>
        <button
          type="button"
          class="chrome-icon-btn"
          aria-label="关闭导航菜单"
          @click="close"
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
          @click="close"
        >
          <span :class="item.icon" />
          <span>{{ item.text }}</span>
        </AutoLink>
      </nav>
    </motion.aside>
  </AnimatePresence>
</template>

<script lang="ts" setup>
import { AnimatePresence, motion } from 'motion-v'
import { acquireBodyScrollLock, releaseBodyScrollLock } from '~/composables/use-body-scroll-lock'
import { navbar } from '~/configs/nav'
import { useMobileNavDrawerReturnFocusBus } from '~/event-bus/mobile-nav'

const open = defineModel<boolean>({ required: true })
const returnFocusBus = useMobileNavDrawerReturnFocusBus()

const route = useRoute()
const drawerRef = ref<HTMLElement | null>(null)
const prefersReducedMotion = usePreferredReducedMotion()
const shouldReduceMotion = computed(() => prefersReducedMotion.value === 'reduce')
const MOTION_EASE = [0.2, 0.8, 0.2, 1] as const

const overlayMotion = computed(() => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: shouldReduceMotion.value ? 0.08 : 0.18,
    ease: MOTION_EASE
  }
}))

const panelMotion = computed(() => ({
  initial: shouldReduceMotion.value
    ? { opacity: 0 }
    : { opacity: 0, x: 18 },
  animate: shouldReduceMotion.value
    ? { opacity: 1 }
    : { opacity: 1, x: 0 },
  exit: shouldReduceMotion.value
    ? { opacity: 0 }
    : { opacity: 0, x: 16 },
  transition: {
    duration: shouldReduceMotion.value ? 0.1 : 0.24,
    ease: MOTION_EASE
  }
}))

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',')

watch(() => route.fullPath, () => {
  open.value = false
})

watch(open, (opened) => {
  if (typeof document === 'undefined')
    return

  if (opened)
    acquireBodyScrollLock()
  else
    releaseBodyScrollLock()

  if (opened) {
    nextTick(() => {
      focusFirstDrawerElement()
    })
    return
  }

  nextTick(() => {
    returnFocusBus.emit()
  })
})

function close() {
  open.value = false
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
    return
  }

  if (event.key === 'Tab' && open.value)
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
  if (typeof document === 'undefined')
    return
  if (open.value)
    releaseBodyScrollLock()
})
</script>
