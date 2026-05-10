<template>
  <section class="twikoo-shell mt-10 border-t border-subtle pt-8">
    <p
      v-if="initError"
      class="mb-4 border border-red-200 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700/50 dark:bg-red-950/30 dark:text-red-200"
    >
      {{ initError }}
      <button
        type="button"
        class="ml-3 border border-current rounded-sm px-2 py-0.5 text-xs"
        @click="retryRender"
      >
        重试
      </button>
    </p>
    <div id="tcomment" />
  </section>
</template>

<script setup lang="ts">
import { useTwikooComments } from '~/composables/useTwikooComments'
import { twikooEnvId } from '~/configs/comment'

const props = defineProps<{
  routePath: string
}>()

const containerSelector = '#tcomment'
const {
  initError,
  renderComments,
  resetRenderState
} = useTwikooComments({
  envId: twikooEnvId,
  el: containerSelector
})

function retryRender() {
  void renderComments(props.routePath)
}

onMounted(() => {
  void renderComments(props.routePath)
})

onUnmounted(() => {
  resetRenderState()
})
</script>
