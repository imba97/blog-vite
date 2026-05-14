import { POSTS_PATH_PREFIX } from '~/constants/route-policy'
import { sortPostListEntriesByDateDesc } from '~/content/post-policy'
import postsMeta from '../../.auto-generate/posts-meta'

export const usePostsStore = defineStore('posts', () => {
  const page = shallowRef(1)
  const size = shallowRef(20)
  const current = shallowRef<{
    path?: string
    title?: string
    date?: string
    tags?: string[]
    categories?: string[]
  } | null>(null)

  const router = useRouter()
  const postRoutes = sortPostListEntriesByDateDesc([...postsMeta])

  const posts = computed(() =>
    postRoutes
  )

  const total = computed(() => posts.value.length)
  const totalPages = computed(() => Math.ceil(total.value / size.value))

  // 设置当前文章的函数
  function setCurrent(path: string) {
    const normalizedPath = path.replace(/\/+$/, '') || '/'
    const route = postRoutes.find(r => r.path === normalizedPath)
    current.value = route || null
  }

  // 始终跟随当前路由，避免重定向场景下 current 丢失
  watch(
    () => router.currentRoute.value.path,
    (path) => {
      if (path.startsWith(POSTS_PATH_PREFIX)) {
        setCurrent(path)
      }
      else {
        current.value = null
      }
    },
    { immediate: true }
  )

  // 不在 beforeEach 里 setCurrent：导航尚未提交时改 current 会让页头标题动画在「上一页」就触发，
  // 真正进入文章页时标题已是终态，看起来像没有进入动画。current 仅由下方 watch(path) 同步。
  router.beforeEach((to) => {
    if (to.name === '/') {
      page.value = 1
    }
  })

  watch(page, () => {
    if (page.value === 1) {
      router.push({
        name: '/'
      })
      return
    }

    router.push({
      name: '/page/[...page]',
      params: {
        page: page.value.toString()
      }
    })
  })

  function setPage(newPage: number) {
    const normalized = Math.min(Math.max(newPage, 1), totalPages.value || 1)
    page.value = normalized
  }

  return {
    posts,
    page,
    size,
    totalPages,
    current,

    setPage
  }
})
