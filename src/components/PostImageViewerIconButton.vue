<style scoped>
.post-image-viewer-icon-button {
  width: 42px;
  height: 42px;
  padding: 0;
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 999px;
  color: rgb(255 255 255 / 98%);
  background: rgb(0 0 0 / 58%);
  line-height: 1;
  appearance: none;
  -webkit-appearance: none;
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  backdrop-filter: blur(12px) saturate(120%);
  box-shadow: 0 8px 24px rgb(0 0 0 / 62%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.post-image-viewer-icon-button:hover {
  border-color: rgb(255 255 255 / 32%);
  background: rgb(0 0 0 / 72%);
}

.post-image-viewer-icon-button:active {
  transform: scale(0.97);
}

.post-image-viewer-icon-button:focus-visible {
  outline: 2px solid rgb(255 255 255 / 85%);
  outline-offset: 2px;
}
</style>

<template>
  <component
    :is="resolvedTag"
    v-bind="componentAttrs"
    class="post-image-viewer-icon-button"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'

interface Props {
  tag?: 'button' | 'a'
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'button'
})

const attrs = useAttrs()
const resolvedTag = computed(() => props.tag)
const componentAttrs = computed(() => {
  if (props.tag === 'button')
    return { type: 'button', ...attrs }
  return attrs
})
</script>
