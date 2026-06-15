import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'

/** Bar motion durations (seconds) — keep aligned with UX expectations. */
export const HEADER_TITLE_BAR_MS = {
  enter: 220,
  leave: 200
} as const

/** Title motion durations (seconds). */
export const HEADER_TITLE_TEXT_MS = {
  enter: 280,
  leave: 220
} as const

export const headerBarMotion = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: HEADER_TITLE_BAR_MS.enter / 1000, ease: [0, 0, 0.2, 1] as const }
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: HEADER_TITLE_BAR_MS.leave / 1000, ease: [0.4, 0, 1, 1] as const }
  }
} as const

export const headerTitleMotion = {
  initial: { opacity: 0, x: 18 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: HEADER_TITLE_TEXT_MS.enter / 1000, ease: [0, 0, 0.2, 1] as const }
  },
  exit: {
    opacity: 0,
    x: -18,
    transition: { duration: HEADER_TITLE_TEXT_MS.leave / 1000, ease: [0.4, 0, 1, 1] as const }
  }
} as const

interface UseHeaderTitleAnimationStateOptions {
  targetTitle: Readonly<Ref<string>>
  targetTitleKey: Readonly<Ref<string>>
}

/**
 * Drives bar + title visibility for motion-v in the header.
 * - No→post: bar first, then title after bar `onAnimationComplete` while `gateTitleUntilBarDone`.
 * - Post→post: title only swaps (AnimatePresence mode wait + key); gate stays open.
 * - Post→home: title exits; `onExitComplete` hides bar.
 */
export function useHeaderTitleAnimationState(options: UseHeaderTitleAnimationStateOptions) {
  const prefersReducedMotion = usePreferredReducedMotion()
  const shouldReduceMotion = computed(() => prefersReducedMotion.value === 'reduce')

  /** 各阶段动画时长（ms），随减少动画喜好统一计算 */
  const motionMs = computed(() => ({
    barEnter: shouldReduceMotion.value ? 90 : HEADER_TITLE_BAR_MS.enter,
    barLeave: shouldReduceMotion.value ? 80 : HEADER_TITLE_BAR_MS.leave,
    titleEnter: shouldReduceMotion.value ? 100 : HEADER_TITLE_TEXT_MS.enter,
    titleLeave: shouldReduceMotion.value ? 90 : HEADER_TITLE_TEXT_MS.leave
  }))

  const resolvedHeaderBarMotion = computed(() => ({
    initial: shouldReduceMotion.value
      ? { opacity: 0 }
      : { opacity: 0, y: 12 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: motionMs.value.barEnter / 1000, ease: [0, 0, 0.2, 1] as const }
    },
    exit: {
      opacity: 0,
      y: shouldReduceMotion.value ? 0 : 12,
      transition: { duration: motionMs.value.barLeave / 1000, ease: [0.4, 0, 1, 1] as const }
    }
  }))

  const resolvedHeaderTitleMotion = computed(() => ({
    initial: shouldReduceMotion.value
      ? { opacity: 0 }
      : { opacity: 0, x: 18 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: motionMs.value.titleEnter / 1000, ease: [0, 0, 0.2, 1] as const }
    },
    exit: {
      opacity: 0,
      x: shouldReduceMotion.value ? 0 : -18,
      transition: { duration: motionMs.value.titleLeave / 1000, ease: [0.4, 0, 1, 1] as const }
    }
  }))

  const barVisible = ref(false)
  const barLeaving = ref(false)
  /** When true, bar has mounted but title slot stays empty until bar intro completes. */
  const gateTitleUntilBarDone = ref(false)
  const presenceTitleKey = ref('')
  const presenceTitle = ref('')
  const layoutTitleCache = ref('')

  let barIntroFallbackTimer: ReturnType<typeof setTimeout> | null = null
  let barLeaveFallbackTimer: ReturnType<typeof setTimeout> | null = null

  function clearBarIntroFallback() {
    if (barIntroFallbackTimer != null) {
      clearTimeout(barIntroFallbackTimer)
      barIntroFallbackTimer = null
    }
  }

  function clearBarLeaveFallback() {
    if (barLeaveFallbackTimer != null) {
      clearTimeout(barLeaveFallbackTimer)
      barLeaveFallbackTimer = null
    }
  }

  function onBarIntroComplete() {
    if (gateTitleUntilBarDone.value)
      gateTitleUntilBarDone.value = false
    clearBarIntroFallback()
  }

  function scheduleBarIntroFallback() {
    clearBarIntroFallback()
    barIntroFallbackTimer = setTimeout(() => {
      barIntroFallbackTimer = null
      onBarIntroComplete()
    }, motionMs.value.barEnter + 40)
  }

  const containerVisible = computed(() =>
    barVisible.value
    || barLeaving.value
    || Boolean(presenceTitleKey.value)
    || gateTitleUntilBarDone.value
  )

  const layoutTitle = computed(() =>
    presenceTitle.value || options.targetTitle.value.trim() || layoutTitleCache.value
  )

  const showTitleMotion = computed(() =>
    Boolean(presenceTitleKey.value) && !gateTitleUntilBarDone.value
  )

  watch(
    () => [options.targetTitle.value.trim(), options.targetTitleKey.value] as const,
    ([t, k], prev) => {
      const prevT = prev?.[0] || ''
      const prevK = prev?.[1] || ''
      const prevHad = Boolean(prevT) && Boolean(prevK)
      const has = Boolean(t) && Boolean(k)

      if (has) {
        clearBarLeaveFallback()
        barLeaving.value = false
        presenceTitleKey.value = k
        presenceTitle.value = t
        layoutTitleCache.value = t
        barVisible.value = true
        gateTitleUntilBarDone.value = !prevHad
        return
      }

      if (!has && prevHad) {
        presenceTitleKey.value = ''
        gateTitleUntilBarDone.value = false
        return
      }

      barVisible.value = false
      clearBarLeaveFallback()
      barLeaving.value = false
      presenceTitleKey.value = ''
      presenceTitle.value = ''
      gateTitleUntilBarDone.value = false
      layoutTitleCache.value = ''
    },
    { immediate: true }
  )

  watch(
    () => [barVisible.value, gateTitleUntilBarDone.value] as const,
    ([bv, gate]) => {
      if (bv && gate)
        scheduleBarIntroFallback()
      else
        clearBarIntroFallback()
    }
  )

  onUnmounted(() => {
    clearBarIntroFallback()
    clearBarLeaveFallback()
  })

  function onTitlePresenceExitComplete() {
    if (options.targetTitleKey.value && options.targetTitle.value.trim())
      return
    clearBarLeaveFallback()
    barLeaving.value = true
    barVisible.value = false
    barLeaveFallbackTimer = setTimeout(() => {
      barLeaveFallbackTimer = null
      barLeaving.value = false
      presenceTitle.value = ''
      layoutTitleCache.value = ''
    }, motionMs.value.barLeave + 40)
  }

  return {
    containerVisible,
    layoutTitle,
    barVisible,
    showTitleMotion,
    presenceTitleKey,
    presenceTitle,
    headerBarMotion: resolvedHeaderBarMotion,
    headerTitleMotion: resolvedHeaderTitleMotion,
    onBarIntroComplete,
    onTitlePresenceExitComplete
  }
}
