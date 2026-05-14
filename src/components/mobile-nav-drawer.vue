<template>
  <Transition
    enter-active-class="transition-opacity duration-250 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <button
      v-if="open"
      type="button"
      class="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] sm:hidden"
      aria-label="关闭导航抽屉"
      @click="close"
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
      v-if="open"
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
    </aside>
  </Transition>
</template>

<script lang="ts" setup>
import { acquireBodyScrollLock, releaseBodyScrollLock } from '~/composables/use-body-scroll-lock'
import { navbar } from '~/configs/nav'
import { useMobileNavDrawerReturnFocusBus } from '~/event-bus/mobile-nav'

const open = defineModel<boolean>({ required: true })
const returnFocusBus = useMobileNavDrawerReturnFocusBus()

const route = useRoute()
const drawerRef = ref<HTMLElement | null>(null)

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
