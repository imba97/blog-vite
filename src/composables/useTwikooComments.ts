import type { TwikooApi } from 'twikoo'
import { resolveCommentPath } from '~/utils/comment-path'

interface UseTwikooCommentsOptions {
  envId: string
  el: string
}

interface TwikooModuleLike {
  default?: TwikooApi
  init?: TwikooApi['init']
}

function resolveTwikooApi(module: TwikooModuleLike): TwikooApi {
  const fromDefault = module.default
  if (fromDefault && typeof fromDefault.init === 'function')
    return fromDefault

  if (typeof module.init === 'function')
    return { init: module.init }

  throw new Error('Twikoo module init() is unavailable')
}

export function useTwikooComments(options: UseTwikooCommentsOptions) {
  const twikooModule = shallowRef<TwikooApi | null>(null)
  const twikooLoading = shallowRef<Promise<TwikooApi> | null>(null)
  const renderedPath = shallowRef('')
  const initError = shallowRef('')
  const pending = shallowRef(false)
  let requestVersion = 0

  async function loadTwikoo() {
    if (twikooModule.value)
      return twikooModule.value

    if (!twikooLoading.value) {
      twikooLoading.value = import('twikoo')
        .then(rawModule => resolveTwikooApi(rawModule as TwikooModuleLike))
        .then((resolvedApi) => {
          twikooModule.value = resolvedApi
          return resolvedApi
        })
        .finally(() => {
          twikooLoading.value = null
        })
    }

    return twikooLoading.value
  }

  async function renderComments(routePath: string) {
    if (typeof window === 'undefined')
      return

    const commentPath = resolveCommentPath(routePath)
    if (!commentPath)
      return

    const currentVersion = ++requestVersion
    pending.value = true
    initError.value = ''
    await nextTick()
    if (currentVersion !== requestVersion)
      return

    const container = document.querySelector<HTMLElement>(options.el)
    if (!container)
      return

    container.innerHTML = ''

    try {
      const twikoo = await loadTwikoo()
      if (currentVersion !== requestVersion)
        return

      await twikoo.init({
        envId: options.envId,
        el: options.el,
        path: commentPath
      })
      renderedPath.value = commentPath
    }
    catch (error) {
      initError.value = error instanceof Error ? error.message : '评论加载失败，请稍后重试'
    }
    finally {
      if (currentVersion === requestVersion)
        pending.value = false
    }
  }

  function resetRenderState() {
    requestVersion++
    renderedPath.value = ''
    pending.value = false
  }

  return {
    pending,
    initError,
    renderedPath,
    renderComments,
    resetRenderState
  }
}
