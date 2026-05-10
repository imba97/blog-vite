import type { Ref } from 'vue'
import { computed, ref, watch } from 'vue'

type Phase = 'idle' | 'entering' | 'steady' | 'leavingTitle' | 'leavingBar'

interface TitleMotionAnimate {
  opacity: number
  x: number
  transition: {
    duration: number
  }
}

interface UseHeaderTitleAnimationStateOptions {
  targetTitle: Readonly<Ref<string>>
  targetTitleKey: Readonly<Ref<string>>
  titleMotionAnimate: TitleMotionAnimate
}

export function useHeaderTitleAnimationState(options: UseHeaderTitleAnimationStateOptions) {
  const phase = ref<Phase>('idle')
  const displayedTitle = ref<string | null>(null)
  const displayedTitleKey = ref('')
  const layoutTitleCache = ref('')
  const titleEnterDelay = ref(0)

  const showBar = computed(() =>
    phase.value === 'entering'
    || phase.value === 'steady'
    || phase.value === 'leavingTitle'
  )

  const containerVisible = computed(() =>
    phase.value !== 'idle' || Boolean(displayedTitle.value)
  )

  const layoutTitle = computed(() =>
    displayedTitle.value || options.targetTitle.value || layoutTitleCache.value
  )

  const titleAnimate = computed(() => ({
    ...options.titleMotionAnimate,
    transition: {
      ...options.titleMotionAnimate.transition,
      delay: titleEnterDelay.value
    }
  }))

  watch(
    () => [options.targetTitle.value, options.targetTitleKey.value] as const,
    ([nextTitle, nextKey], previous) => {
      const prevTitle = previous?.[0] || ''
      const hadTitle = Boolean(prevTitle)
      const hasTitle = Boolean(nextTitle)

      if (!hadTitle && hasTitle) {
        phase.value = 'entering'
        titleEnterDelay.value = 0.12
        displayedTitle.value = nextTitle
        displayedTitleKey.value = nextKey
        layoutTitleCache.value = nextTitle
        return
      }

      if (hadTitle && hasTitle) {
        phase.value = 'steady'
        titleEnterDelay.value = 0
        displayedTitle.value = nextTitle
        displayedTitleKey.value = nextKey
        layoutTitleCache.value = nextTitle
        return
      }

      if (hadTitle && !hasTitle) {
        phase.value = 'leavingTitle'
        titleEnterDelay.value = 0
        layoutTitleCache.value = prevTitle
        displayedTitle.value = null
        displayedTitleKey.value = ''
        return
      }

      phase.value = 'idle'
      titleEnterDelay.value = 0
      displayedTitle.value = null
      displayedTitleKey.value = ''
      layoutTitleCache.value = ''
    },
    { immediate: true }
  )

  function handleTitleExitComplete() {
    if (phase.value === 'leavingTitle' && !options.targetTitle.value) {
      phase.value = 'leavingBar'
    }
  }

  function handleBarExitComplete() {
    if (phase.value === 'leavingBar' && !options.targetTitle.value) {
      phase.value = 'idle'
      layoutTitleCache.value = ''
    }
  }

  return {
    containerVisible,
    showBar,
    displayedTitle,
    displayedTitleKey,
    layoutTitle,
    titleAnimate,
    handleTitleExitComplete,
    handleBarExitComplete
  }
}
