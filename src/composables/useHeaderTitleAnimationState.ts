import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'

/** Bar motion durations (milliseconds) — keep aligned with the CSS transitions in header.vue. */
export const HEADER_TITLE_BAR_MS = {
  enter: 400,
  leave: 400
} as const

/** Title motion durations (milliseconds). */
export const HEADER_TITLE_TEXT_MS = {
  enter: 600,
  leave: 600
} as const

interface UseHeaderTitleAnimationStateOptions {
  targetTitle: Readonly<Ref<string>>
  targetTitleKey: Readonly<Ref<string>>
}

/**
 * Drives bar + title visibility for the header <Transition> animations.
 * - No→post: bar first, then title after bar `@after-enter` while `gateTitleUntilBarDone`.
 * - Post→post: title only swaps (Transition mode out-in + key); gate stays open.
 * - Post→home: title exits; `@after-leave` hides bar.
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
    },
    // immediate: without a mount animation there is no initial `@after-enter`
    // to clear the gate on direct page load, so schedule the fallback at setup.
    { immediate: true }
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
    onBarIntroComplete,
    onTitlePresenceExitComplete
  }
}
