<template>
  <a
    :href="props.href"
    fyc gap-1
    :class="showExternalIcon ? 'pr [&:hover_.external-icon]:(opacity-100)' : undefined"
    @click="navigate"
  >
    <slot />
    <span
      v-if="showExternalIcon && isExternalUrl(props.href)"
      class="external-icon"
      i-iconamoon-link-external-duotone pa right--1 top--1 size-4 bg-primary opacity-0 transition-opacity duration-300 dark:bg-primary-light
    />
  </a>
</template>

<script lang="ts" setup>
import { navigateSpaOrExternal } from '~/utils/spa-navigation'
import { isExternalUrl } from '~/utils/url'

const props = withDefaults(
  defineProps<{
    href: string
    showExternalIcon?: boolean
  }>(),
  {
    showExternalIcon: true
  }
)

const router = useRouter()

function navigate(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return

  if (props.href.startsWith('#'))
    return

  event.preventDefault()

  navigateSpaOrExternal(router, props.href)
  event.stopPropagation()
}
</script>
