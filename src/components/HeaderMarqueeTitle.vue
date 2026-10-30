<style scoped>
/* 静止时只让右边缘渐隐，提示标题被截断；左侧不渐隐，保证首字清晰 */
.title-mask {
  mask: linear-gradient(to right, black 92%, transparent);
  -webkit-mask: linear-gradient(to right, black 92%, transparent);
}

/* 滚动时两侧渐隐，让文字从边缘柔和地进出 */
.title-mask-scrolling {
  mask: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  -webkit-mask: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}

.marquee-track {
  --marquee-gap: 50px;
  --marquee-shift: 0px;
  --marquee-duration: 12s;
  column-gap: var(--marquee-gap);
}

/* 每次播放只滚一遍：进入页面自动播一次，hover / 触屏点按再按需重播 */
.marquee-track.is-scrolling {
  animation: marquee-scroll var(--marquee-duration) linear 1;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track,
  .marquee-track.is-scrolling {
    animation: none !important;
    transform: translateX(0) !important;
  }
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
    :class="{
      'title-mask': shouldAnimateMarquee,
      'title-mask-scrolling': isScrolling
    }"
    @pointerenter="onPointerEnter"
    @pointerdown="onPointerDown"
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
        v-if="shouldAnimateMarquee"
        :key="`${trackKey}-${playCount}`"
        class="marquee-track h-full min-w-0 flex items-center whitespace-nowrap"
        :class="{ 'is-scrolling': isScrolling }"
        :style="trackStyle"
        @animationend="onMarqueeAnimationEnd"
      >
        <component :is="tag" :class="textClass">
          {{ displayTitle }}
        </component>
        <span :class="textClass" aria-hidden="true">{{ displayTitle }}</span>
      </div>

      <component
        :is="tag"
        v-else
        class="h-full min-w-0 fyc truncate"
        :class="textClass"
      >
        {{ displayTitle }}
      </component>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    title: string
    textClass?: string
    /** 标题元素标签：页面标题用 h1，保证每页只有一个 h1 */
    tag?: string
  }>(),
  {
    textClass: '',
    tag: 'span'
  }
)
const tag = computed(() => props.tag || 'span')

const MARQUEE_GAP_PX = 50
const MIN_DURATION_SECONDS = 8
const MAX_DURATION_SECONDS = 26
const PIXELS_PER_SECOND = 42

const containerRef = ref<HTMLDivElement | null>(null)
const measureRef = ref<HTMLSpanElement | null>(null)
const textWidth = ref(0)
const isOverflowing = ref(false)
const prefersReducedMotion = usePreferredReducedMotion()
const shouldAnimateMarquee = computed(() =>
  isOverflowing.value && prefersReducedMotion.value !== 'reduce'
)

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

const isScrolling = ref(false)
const playCount = ref(0)
// 进入页面（或换文章）后自动播一遍；hover / 触屏点按只负责按需重播
let autoPlayPending = true

function startScroll() {
  if (!shouldAnimateMarquee.value || isScrolling.value)
    return
  isScrolling.value = true
  playCount.value++
}

function onMarqueeAnimationEnd(event: AnimationEvent) {
  if (event.target !== event.currentTarget)
    return
  isScrolling.value = false
}

function onPointerEnter(event: PointerEvent) {
  // 触屏交给 pointerdown，避免同一次点按被 pointerenter 重复触发
  if (event.pointerType === 'touch')
    return
  startScroll()
}

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    return
  startScroll()
}

let observer: ResizeObserver | null = null
let rafId: number | null = null

watch(displayTitle, () => {
  autoPlayPending = true
  isScrolling.value = false
  scheduleMeasure()
}, { immediate: true })

watch(shouldAnimateMarquee, (canScroll) => {
  if (!canScroll)
    isScrolling.value = false
})

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

  const nextOverflowing = nextWidth > container.clientWidth + 1
  isOverflowing.value = nextOverflowing

  if (!nextOverflowing) {
    isScrolling.value = false
    return
  }

  if (autoPlayPending && shouldAnimateMarquee.value) {
    autoPlayPending = false
    startScroll()
  }
}
</script>
