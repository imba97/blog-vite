import type { PostViewerImageItem } from '~/types/post-image-viewer'
import { isArticlePostRoute } from '~/utils/route-page-kind'

interface CollectableImage extends PostViewerImageItem {
  el: HTMLImageElement
}

function resolveImageItem(img: HTMLImageElement): PostViewerImageItem | null {
  const src = img.currentSrc || img.getAttribute('src') || ''
  if (!src)
    return null

  const anchor = img.closest('a[href]') as HTMLAnchorElement | null
  const figure = img.closest('figure')
  const figcaption = figure?.querySelector('figcaption')?.textContent?.trim()

  return {
    src,
    alt: img.getAttribute('alt') || '',
    title: img.getAttribute('title') || '',
    caption: figcaption || '',
    link: anchor?.href || ''
  }
}

function shouldIgnoreImage(img: HTMLImageElement): boolean {
  if (img.dataset.preview === 'off')
    return true
  if (img.classList.contains('no-preview'))
    return true
  return false
}

function collectImages(container: HTMLElement): CollectableImage[] {
  const images = Array.from(container.querySelectorAll('img'))
  return images
    .filter(img => !shouldIgnoreImage(img))
    .map((img) => {
      const item = resolveImageItem(img)
      if (!item)
        return null
      return {
        ...item,
        el: img
      } as CollectableImage
    })
    .filter((item): item is CollectableImage => item !== null)
}

export function usePostImageViewer() {
  const route = useRoute()
  const show = ref(false)
  const images = ref<PostViewerImageItem[]>([])
  const activeIndex = ref(0)

  function close() {
    show.value = false
  }

  function reset() {
    close()
    images.value = []
    activeIndex.value = 0
  }

  function onClickCapture(event: MouseEvent) {
    if (event.button !== 0)
      return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return
    if (!isArticlePostRoute(route.path))
      return

    const target = event.target as HTMLElement | null
    const img = target?.closest('img') as HTMLImageElement | null
    if (!img || shouldIgnoreImage(img))
      return

    const proseShell = img.closest('.prose.prose-shell') as HTMLElement | null
    if (!proseShell || !proseShell.contains(img))
      return

    const collected = collectImages(proseShell)
    if (!collected.length)
      return

    const index = collected.findIndex(item => item.el === img)
    if (index < 0)
      return

    event.preventDefault()
    event.stopPropagation()

    images.value = collected.map(({ el: _el, ...item }) => item)
    activeIndex.value = index
    show.value = true
  }

  onMounted(() => {
    document.addEventListener('click', onClickCapture, true)
  })

  watch(() => route.path, () => {
    reset()
  })

  onUnmounted(() => {
    document.removeEventListener('click', onClickCapture, true)
  })

  return {
    show,
    images,
    activeIndex,
    close,
    reset
  }
}
