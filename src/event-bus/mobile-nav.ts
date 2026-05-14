import { useEventBus } from '@vueuse/core'

const MOBILE_NAV_DRAWER_RETURN_FOCUS_KEY = 'mobile-nav-drawer:return-focus' as const

/** 移动端导航抽屉关闭后，将焦点归还菜单触发器 */
export function useMobileNavDrawerReturnFocusBus() {
  return useEventBus<void>(MOBILE_NAV_DRAWER_RETURN_FOCUS_KEY)
}
