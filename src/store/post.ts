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
  const routes: any[] = router.getRoutes()
    .filter(i => i.path.startsWith('/posts') && i.meta.frontmatter.date && !i.meta.frontmatter.draft)
    .filter(i => !i.path.endsWith('.html'))
    .map(i => ({
      path: i.path,
      title: i.meta.frontmatter.title,
      date: i.meta.frontmatter.date,
      tags: i.meta.frontmatter.tags,
      categories: i.meta.frontmatter.categories
    }))

  const posts = computed(() =>
    [...routes || []]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
  )

  const total = computed(() => posts.value.length)
  const totalPages = computed(() => Math.ceil(total.value / size.value))

  // 设置当前文章的函数
  function setCurrent(path: string) {
    const route = routes.find(r => r.path === path)
    current.value = route || null
  }

  // 初始化时检查当前路由
  const currentRoute = router.currentRoute.value
  if (currentRoute.path.startsWith('/posts/')) {
    setCurrent(currentRoute.path)
  }

  router.beforeEach((to) => {
    // 设置当前文章
    if (to.path.startsWith('/posts/')) {
      setCurrent(to.path)
    }
    else {
      current.value = null
    }

    if (to.name === '/') {
      page.value = 1
      return true
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
