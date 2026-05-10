<style scoped>
.title-mask {
  mask: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  -webkit-mask: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

.marquee-track {
  --marquee-gap: 50px;
  --marquee-shift: 0px;
  --marquee-duration: 12s;
  column-gap: var(--marquee-gap);
  animation: marquee-scroll var(--marquee-duration) linear infinite;
  will-change: transform;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(calc(-1 * var(--marquee-shift)));
  }
}
</style>

<template>
  <div
    ref="containerRef"
    class="relative h-full min-w-0 overflow-hidden"
    :class="{ 'title-mask': isOverflowing }"
  >
    <span
      ref="measureRef"
      class="pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
      :class="textClass"
      aria-hidden="true"
    >
      {{ displayTitle }}
    </span>

    <div v-if="displayTitle" class="h-full min-w-0">
      <div
        v-if="isOverflowing"
        :key="trackKey"
        class="marquee-track h-full min-w-0 flex items-center whitespace-nowrap"
        :style="trackStyle"
      >
        <span :class="textClass">{{ displayTitle }}</span>
        <span :class="textClass" aria-hidden="true">{{ displayTitle }}</span>
      </div>

      <div v-else class="h-full min-w-0 fyc truncate" :class="textClass">
        {{ displayTitle }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    title: string
    textClass?: string
  }>(),
  {
    textClass: ''
  }
)
const MARQUEE_GAP_PX = 50
const MIN_DURATION_SECONDS = 8
const MAX_DURATION_SECONDS = 26
const PIXELS_PER_SECOND = 42

const containerRef = ref<HTMLDivElement | null>(null)
const measureRef = ref<HTMLSpanElement | null>(null)
const textWidth = ref(0)
const isOverflowing = ref(false)

const displayTitle = computed(() => props.title.trim())

const loopWidth = computed(() => Math.max(0, textWidth.value + MARQUEE_GAP_PX))
const trackKey = computed(() => `${displayTitle.value}-${loopWidth.value}`)
const durationSeconds = computed(() => {
  if (!loopWidth.value)
    return MIN_DURATION_SECONDS
  const estimated = loopWidth.value / PIXELS_PER_SECOND
  return Math.min(MAX_DURATION_SECONDS, Math.max(MIN_DURATION_SECONDS, estimated))
})

const trackStyle = computed(() => ({
  '--marquee-gap': `${MARQUEE_GAP_PX}px`,
  '--marquee-shift': `${loopWidth.value}px`,
  '--marquee-duration': `${durationSeconds.value}s`
}))

let observer: ResizeObserver | null = null
let rafId: number | null = null

watch(displayTitle, () => {
  scheduleMeasure()
}, { immediate: true })

onMounted(() => {
  scheduleMeasure()
  observer = new ResizeObserver(() => {
    scheduleMeasure()
  })

  if (containerRef.value)
    observer.observe(containerRef.value)
  if (measureRef.value)
    observer.observe(measureRef.value)
})

onUnmounted(() => {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }

  if (observer) {
    observer.disconnect()
    observer = null
  }
})

function scheduleMeasure() {
  if (typeof window === 'undefined') {
    measureLayout()
    return
  }

  if (rafId != null)
    cancelAnimationFrame(rafId)

  rafId = window.requestAnimationFrame(() => {
    rafId = null
    measureLayout()
  })
}

function measureLayout() {
  const container = containerRef.value
  const textEl = measureRef.value
  if (!container || !textEl || !displayTitle.value) {
    textWidth.value = 0
    isOverflowing.value = false
    return
  }

  const nextWidth = textEl.scrollWidth
  textWidth.value = nextWidth
  isOverflowing.value = nextWidth > container.clientWidth + 1
}
</script>
