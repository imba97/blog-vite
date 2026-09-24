<style scoped>
.header-bar-enter-active {
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 退出与进入互为镜像；退出用 easeInQuart，尾部加速度比 easeInExpo
   平缓，后半段不会「猛地收掉」。位移与透明度同曲线同时长，同步结束 */
.header-bar-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.5, 0, 0.75, 0),
    transform 0.4s cubic-bezier(0.5, 0, 0.75, 0);
}

/* 位移 + 高度收缩到一半的组合：滑入时竖线从下方「长出来」 */
.header-bar-enter-from,
.header-bar-leave-to {
  opacity: 0;
  transform: translateY(12px) scaleY(0.5);
}

/* 进入 easeOutQuart / 退出 easeInQuart 互为镜像：Expo 系曲线前载/后载
   太极端（0.4s 的动画 0.2s 就「看起来演完」），Quart 系把动画过程
   均匀分布在整个时长里。透明度 0.6s 比位移 0.4s 稍晚结束，
   到位/离场后还留一段柔和的淡入淡出 */
.header-title-enter-active {
  transition:
    opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1),
    transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

/* 退出：位移 0.6s easeInQuart（切入 easeOutQuart 的时间镜像），
   透明度延迟 0.2s 开始、0.4s 淡出——前 0.2s 文字以完全不透明状态
   滑入左侧渐隐区（mask 效果清晰展现），后 0.4s 边滑边隐，
   两者在 0.6s 同时结束 */
.header-title-leave-active {
  transition:
    opacity 0.4s cubic-bezier(0.5, 0, 0.75, 0) 0.2s,
    transform 0.6s cubic-bezier(0.5, 0, 0.75, 0);
}

.header-title-enter-from {
  opacity: 0;
  transform: translateX(-18px);
}

.header-title-leave-to {
  opacity: 0;
  transform: translateX(-60px);
}

.header-title-mask {
  mask-image: linear-gradient(to right, transparent 0, #000 8px);
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 8px);
}

@media (prefers-reduced-motion: reduce) {
  .header-bar-enter-active {
    transition-duration: 0.09s;
  }

  .header-bar-leave-active {
    transition-duration: 0.08s;
  }

  .header-title-enter-active {
    transition-duration: 0.1s;
  }

  .header-title-leave-active {
    transition-duration: 0.09s;
    transition-delay: 0s;
  }

  .header-bar-enter-from,
  .header-bar-leave-to,
  .header-title-enter-from,
  .header-title-leave-to {
    transform: none;
  }
}
</style>

<template>
  <header class="sticky left-0 top-0 z-40 border-b border-subtle bg-white/90 backdrop-blur-md dark:bg-neutral-900/92">
    <div class="site-container h-16 flex items-center justify-between gap-5">
      <div class="min-w-0 fyc flex-1 gap-2.5">
        <button
          type="button"
          class="chrome-icon-btn fyc shrink-0 gap-4 rounded-lg p-1"
          aria-label="返回首页"
          @click="goHome"
        >
          <img :src="currentFavicon" alt="站点图标" class="size-10 shrink-0 object-cover">
        </button>

        <div
          v-if="containerVisible"
          class="min-w-0 fyc"
        >
          <Transition name="header-bar" :appear="enableBarAppear" @after-enter="onBarIntroComplete">
            <div
              v-if="barVisible"
              class="h-[34px] w-[5px] shrink-0 rounded-sm bg-primary-2/45 dark:bg-primary-light/55"
            />
          </Transition>

          <!-- 原 gap-2 的 8px 改为标题容器的 pl-2，渐隐区正好落在这段空隙上，
               文字相对竖线的位置不变；长标题 marquee 的边缘渐隐由
               HeaderMarqueeTitle 内部处理 -->
          <div class="header-title-mask relative h-[30px] max-w-70 min-w-0 overflow-hidden pl-2">
            <div
              aria-hidden="true"
              class="invisible truncate text-base font-medium sm:text-lg"
            >
              {{ layoutTitle }}
            </div>

            <Transition
              name="header-title"
              mode="out-in"
              @after-leave="onTitlePresenceExitComplete"
            >
              <div
                v-if="showTitleMotion"
                :key="presenceTitleKey"
                class="absolute inset-y-0 left-2 right-0"
              >
                <HeaderMarqueeTitle
                  :title="presenceTitle"
                  text-class="text-base text-gray-700 font-medium sm:text-lg dark:text-white/90"
                />
              </div>
            </Transition>
          </div>
        </div>
      </div>
      <div class="fyc shrink-0 gap-1 sm:gap-2">
        <nav class="hidden fyc gap-2 sm:flex sm:gap-4" aria-label="主导航">
          <AutoLink
            v-for="item in navbar"
            :key="item.link"
            :href="item.link"
            clickable-100
            class="nav-link focus-ring-primary"
          >
            <span :class="item.icon" />
            <span class="hidden sm:inline">{{ item.text }}</span>
          </AutoLink>
        </nav>

        <button
          ref="searchButtonRef"
          type="button"
          class="chrome-icon-btn"
          aria-label="打开站内搜索"
          @click="openSearch"
        >
          <span class="i-carbon-search text-base" />
        </button>

        <button
          ref="menuButtonRef"
          type="button"
          class="chrome-icon-btn sm:hidden"
          aria-label="打开导航菜单"
          :aria-expanded="isDrawerOpen"
          aria-controls="mobile-nav-drawer"
          @click="toggleDrawer"
        >
          <span :class="isDrawerOpen ? 'i-carbon-close-large text-base' : 'i-carbon-menu text-base'" />
        </button>
      </div>
    </div>
  </header>

  <MobileNavDrawer v-model="isDrawerOpen" />
</template>

<script lang="ts" setup>
import MobileNavDrawer from '~/components/mobile-nav-drawer.vue'
import { useHeaderTitleAnimationState } from '~/composables/useHeaderTitleAnimationState'
import { navbar } from '~/configs/nav'
import { useMobileNavDrawerReturnFocusBus } from '~/event-bus/mobile-nav'
import { usePostsStore } from '~/store/post'
import { useSearchOverlayStore } from '~/store/search-overlay'
import { isArticlePostRoute } from '~/utils/route-page-kind'
import { DEFAULT_FAVICON, getCurrentFavicon } from '~/utils/seasonal-avatar'

const router = useRouter()
const route = useRoute()
const postsStore = usePostsStore()
const searchOverlay = useSearchOverlayStore()
const isPostPage = computed(() => isArticlePostRoute(route.path))
const currentFavicon = ref(DEFAULT_FAVICON)
const isDrawerOpen = ref(false)
const menuButtonRef = ref<HTMLButtonElement | null>(null)
const searchButtonRef = ref<HTMLButtonElement | null>(null)

const returnFocusBus = useMobileNavDrawerReturnFocusBus()
returnFocusBus.on(() => {
  menuButtonRef.value?.focus()
})

// 竖线进入动画只在 hydration 之后的挂载（SPA 导航进入文章页）启用：
// 直开文章页时 SSR 已把竖线画出来，若 hydration 时再放 appear 动画
// 会出现「先可见 → 闪隐 → 再淡入」的闪烁
const enableBarAppear = ref(false)

onMounted(() => {
  currentFavicon.value = getCurrentFavicon()
  enableBarAppear.value = true
})

const {
  containerVisible,
  layoutTitle,
  barVisible,
  showTitleMotion,
  presenceTitleKey,
  presenceTitle,
  onBarIntroComplete,
  onTitlePresenceExitComplete
} = useHeaderTitleAnimationState({
  targetTitle: computed(() => postsStore.current?.title?.trim() || ''),
  targetTitleKey: computed(() => postsStore.current?.path || postsStore.current?.title?.trim() || '')
})

function goHome() {
  if (isPostPage.value) {
    const canGoBack = typeof window !== 'undefined' && Boolean(window.history.state?.back)
    if (canGoBack) {
      router.back()
      return
    }
  }
  router.push('/')
}

function openSearch() {
  searchOverlay.open()
}

function toggleDrawer() {
  isDrawerOpen.value = !isDrawerOpen.value
}
</script>
