<style scoped>
.post-image-viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 90%);
  padding: calc(12px + env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom));
  /* The whole overlay pans the image, so no browser gesture may take over. */
  touch-action: none;
  cursor: grab;
}

.post-image-viewer.is-dragging {
  cursor: grabbing;
}

/* The caption and the controls never start a drag, so they keep their cursor. */
.post-image-viewer .post-image-viewer__footer {
  cursor: default;
}

.post-image-viewer .post-image-viewer__icon-btn,
.post-image-viewer .post-image-viewer__mobile-nav-btn {
  cursor: pointer;
}

.post-image-viewer__content {
  max-width: min(1100px, 100%);
  max-height: min(78vh, 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.post-image-viewer__content img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  user-select: none;
  touch-action: none;
}

.post-image-viewer__icon-btn {
  position: absolute;
  z-index: 4;
}

.post-image-viewer__close {
  top: max(14px, env(safe-area-inset-top));
  right: 14px;
}

.post-image-viewer__open {
  top: max(14px, env(safe-area-inset-top));
  right: 64px;
  text-decoration: none;
}

.post-image-viewer__prev {
  left: 14px;
}

.post-image-viewer__next {
  right: 14px;
}

.post-image-viewer__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgb(0 0 0 / 62%), rgb(0 0 0 / 0%));
  color: rgb(255 255 255 / 92%);
  z-index: 3;
}

.post-image-viewer__meta {
  min-width: 0;
}

.post-image-viewer__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
}

.post-image-viewer__caption {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.55;
  color: rgb(255 255 255 / 78%);
}

.post-image-viewer__counter {
  font-size: 12px;
  color: rgb(255 255 255 / 75%);
  flex: none;
}

.post-image-viewer__icon-glyph {
  display: block;
  line-height: 1;
  transform: translateX(var(--post-viewer-icon-offset-x, 1px));
}

.post-image-viewer__error {
  color: rgb(255 255 255 / 78%);
  font-size: 14px;
  letter-spacing: 0.01em;
}

.post-image-viewer-enter-active,
.post-image-viewer-leave-active {
  transition: opacity 0.2s ease;
}

.post-image-viewer-enter-from,
.post-image-viewer-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .post-image-viewer__desktop-nav-btn {
    display: none;
  }

  .post-image-viewer__mobile-nav {
    position: absolute;
    left: 50%;
    bottom: calc(74px + env(safe-area-inset-bottom));
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 14px;
    transform: translateX(-50%);
  }

  .post-image-viewer__mobile-nav-btn {
    width: 42px;
    height: 42px;
  }
}

@media (min-width: 641px) {
  .post-image-viewer__mobile-nav {
    display: none;
  }
}
</style>

<template>
  <Teleport to="body">
    <Transition name="post-image-viewer">
      <div
        v-if="show && currentImage"
        class="post-image-viewer"
        :class="{ 'is-dragging': isDragging }"
        :style="viewerStyleVars"
        @click.self="onBackdropClick"
        @mousedown="onMouseDown"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @wheel="onWheel"
      >
        <PostImageViewerIconButton
          class="post-image-viewer__icon-btn post-image-viewer__close"
          aria-label="关闭预览"
          @click="close"
        >
          <span class="post-image-viewer__icon-glyph i-carbon-close text-base" />
        </PostImageViewerIconButton>

        <PostImageViewerIconButton
          tag="a"
          :href="currentImage.link || currentImage.src"
          target="_blank"
          rel="noopener noreferrer"
          class="post-image-viewer__icon-btn post-image-viewer__open"
          title="打开原图"
          @click.stop
        >
          <span class="post-image-viewer__icon-glyph i-carbon-launch text-sm" />
        </PostImageViewerIconButton>

        <PostImageViewerIconButton
          v-if="canNavigate"
          class="post-image-viewer__icon-btn post-image-viewer__prev post-image-viewer__desktop-nav-btn"
          aria-label="上一张"
          @click.stop="goPrev"
        >
          <span class="post-image-viewer__icon-glyph i-carbon-chevron-left text-base" />
        </PostImageViewerIconButton>

        <PostImageViewerIconButton
          v-if="canNavigate"
          class="post-image-viewer__icon-btn post-image-viewer__next post-image-viewer__desktop-nav-btn"
          aria-label="下一张"
          @click.stop="goNext"
        >
          <span class="post-image-viewer__icon-glyph i-carbon-chevron-right text-base" />
        </PostImageViewerIconButton>

        <div v-if="canNavigate" class="post-image-viewer__mobile-nav">
          <PostImageViewerIconButton
            class="post-image-viewer__mobile-nav-btn"
            aria-label="上一张"
            @click.stop="goPrev"
          >
            <span class="post-image-viewer__icon-glyph i-carbon-chevron-left text-base" />
          </PostImageViewerIconButton>
          <PostImageViewerIconButton
            class="post-image-viewer__mobile-nav-btn"
            aria-label="下一张"
            @click.stop="goNext"
          >
            <span class="post-image-viewer__icon-glyph i-carbon-chevron-right text-base" />
          </PostImageViewerIconButton>
        </div>

        <div
          class="post-image-viewer__content"
          @click="onContentClick"
        >
          <img
            v-show="!imageFailed"
            ref="previewImageRef"
            :src="currentImage.src"
            :alt="currentImage.alt || 'Post image preview'"
            :style="imageStyle"
            draggable="false"
            @error="imageFailed = true"
          >
          <div v-if="imageFailed" class="post-image-viewer__error">
            图片加载失败
          </div>
        </div>

        <div class="post-image-viewer__footer">
          <div class="post-image-viewer__meta">
            <div v-if="displayTitle" class="post-image-viewer__title">
              {{ displayTitle }}
            </div>
            <div v-if="displayCaption" class="post-image-viewer__caption">
              {{ displayCaption }}
            </div>
          </div>
          <div class="post-image-viewer__counter">
            {{ counterText }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import type { PostViewerImageItem } from '~/types/post-image-viewer'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import PostImageViewerIconButton from '~/components/PostImageViewerIconButton.vue'

interface Props {
  show: boolean
  images: PostViewerImageItem[]
  activeIndex: number
  iconOffsetX?: number
}

const props = withDefaults(defineProps<Props>(), {
  iconOffsetX: 1
})
const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'update:activeIndex', value: number): void
}>()

const maxScale = 5
const minScale = 0.75
const dragThreshold = 4
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
const pointerMoved = ref(false)
const imageFailed = ref(false)
const previewImageRef = ref<HTMLImageElement | null>(null)

const dragStartX = ref(0)
const dragStartY = ref(0)
const startTranslateX = ref(0)
const startTranslateY = ref(0)
const pinchDistance = ref<number | null>(null)
const pinchStartScale = ref(1)

const normalizedIndex = computed(() => {
  const total = props.images.length
  if (!total)
    return 0
  if (props.activeIndex < 0)
    return 0
  if (props.activeIndex >= total)
    return total - 1
  return props.activeIndex
})

const currentImage = computed(() => props.images[normalizedIndex.value])
const counterText = computed(() => `${normalizedIndex.value + 1} / ${props.images.length}`)
const canNavigate = computed(() => props.images.length > 1)
const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: 'center center',
  transition: isDragging.value ? 'none' : 'transform 0.2s ease'
}))
const displayTitle = computed(() => currentImage.value?.title || currentImage.value?.alt || '')
const displayCaption = computed(() => currentImage.value?.caption || '')
const viewerStyleVars = computed(() => ({
  '--post-viewer-icon-offset-x': `${props.iconOffsetX}px`
}))

function resetTransform() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
  pinchDistance.value = null
  imageFailed.value = false
  pointerMoved.value = false
}

function close() {
  emit('update:show', false)
}

/**
 * Releasing a drag outside the image makes the browser dispatch the trailing
 * click on the nearest common ancestor, which must not count as a tap on the
 * backdrop. The flag is consumed so the next real click still closes.
 */
function consumeDragClick() {
  if (!pointerMoved.value)
    return false
  pointerMoved.value = false
  return true
}

function onBackdropClick() {
  if (consumeDragClick())
    return
  close()
}

function onContentClick(event: MouseEvent) {
  if (consumeDragClick())
    return
  // The image itself keeps its drag interaction, anywhere else in the image
  // box is the backdrop left behind by a moved image.
  if (event.target === previewImageRef.value)
    return
  close()
}

function updateIndex(nextIndex: number) {
  if (!props.images.length)
    return
  const total = props.images.length
  const normalized = (nextIndex + total) % total
  emit('update:activeIndex', normalized)
}

function goPrev() {
  updateIndex(normalizedIndex.value - 1)
}

function goNext() {
  updateIndex(normalizedIndex.value + 1)
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  if (!previewImageRef.value)
    return

  const prevScale = scale.value
  const delta = event.deltaY > 0 ? -0.1 : 0.1
  const nextScale = Math.max(minScale, Math.min(maxScale, prevScale + delta))
  if (nextScale === prevScale)
    return

  const rect = previewImageRef.value.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2
  const relXFromCenter = event.clientX - centerX
  const relYFromCenter = event.clientY - centerY
  const ratio = nextScale / prevScale

  // Keep cursor position as zoom anchor on desktop wheel zoom.
  translateX.value += (1 - ratio) * relXFromCenter
  translateY.value += (1 - ratio) * relYFromCenter
  scale.value = nextScale
}

function markPointerMoved(offsetX: number, offsetY: number) {
  if (!pointerMoved.value && Math.hypot(offsetX, offsetY) >= dragThreshold)
    pointerMoved.value = true
}

// Controls and the caption keep their own pointer behavior, everything else in
// the overlay pans the image.
function isDragSurface(target: EventTarget | null) {
  if (!(target instanceof Element))
    return false
  return !target.closest('.post-image-viewer__footer, .post-image-viewer__icon-btn, .post-image-viewer__mobile-nav')
}

function startDrag(clientX: number, clientY: number) {
  isDragging.value = true
  pointerMoved.value = false
  dragStartX.value = clientX
  dragStartY.value = clientY
  startTranslateX.value = translateX.value
  startTranslateY.value = translateY.value
}

function onMouseDown(event: MouseEvent) {
  if (event.button !== 0 || !isDragSurface(event.target))
    return
  event.preventDefault()
  startDrag(event.clientX, event.clientY)
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging.value)
    return
  const offsetX = event.clientX - dragStartX.value
  const offsetY = event.clientY - dragStartY.value
  markPointerMoved(offsetX, offsetY)
  translateX.value = startTranslateX.value + offsetX
  translateY.value = startTranslateY.value + offsetY
}

function onMouseUp() {
  isDragging.value = false
}

function distanceBetweenTouches(event: TouchEvent) {
  if (event.touches.length < 2)
    return null
  const [a, b] = [event.touches[0], event.touches[1]]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 1) {
    if (!isDragSurface(event.target))
      return
    const touch = event.touches[0]
    startDrag(touch.clientX, touch.clientY)
    return
  }

  if (event.touches.length === 2) {
    isDragging.value = false
    pointerMoved.value = true
    pinchDistance.value = distanceBetweenTouches(event)
    pinchStartScale.value = scale.value
  }
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length === 1 && isDragging.value) {
    const touch = event.touches[0]
    const offsetX = touch.clientX - dragStartX.value
    const offsetY = touch.clientY - dragStartY.value
    markPointerMoved(offsetX, offsetY)
    translateX.value = startTranslateX.value + offsetX
    translateY.value = startTranslateY.value + offsetY
    return
  }

  if (event.touches.length === 2) {
    event.preventDefault()
    pointerMoved.value = true
    const nextDistance = distanceBetweenTouches(event)
    if (!pinchDistance.value || !nextDistance)
      return
    const ratio = nextDistance / pinchDistance.value
    const nextScale = Math.max(minScale, Math.min(maxScale, pinchStartScale.value * ratio))
    scale.value = nextScale
  }
}

function onTouchEnd() {
  if (pinchDistance.value && scale.value < 1)
    scale.value = 1
  isDragging.value = false
  pinchDistance.value = null
}

function onKeyDown(event: KeyboardEvent) {
  if (!props.show)
    return

  if (event.key === 'Escape') {
    close()
    return
  }
  if (event.key === 'ArrowLeft' && canNavigate.value) {
    goPrev()
    return
  }
  if (event.key === 'ArrowRight' && canNavigate.value)
    goNext()
}

watch(
  () => props.show,
  () => {
    resetTransform()
  },
  { immediate: true }
)

watch(() => normalizedIndex.value, () => {
  resetTransform()
})

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})
</script>
