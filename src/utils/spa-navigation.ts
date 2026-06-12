import type { Router } from 'vue-router'
import { tracker } from '~/utils/analytics'
import { isExternalUrl } from '~/utils/url'

const MAILTO_TEL_RE = /^(?:mailto:|tel:)/i

export function isExternalOrNonSpaHref(href: string): boolean {
  if (!href || href.startsWith('#'))
    return false
  if (isExternalUrl(href) || MAILTO_TEL_RE.test(href))
    return true
  return false
}

export function shouldDelegateSpaNavigation(
  event: MouseEvent,
  anchor: HTMLAnchorElement,
  href: string
): boolean {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return false
  if (anchor.target === '_blank' || anchor.hasAttribute('download'))
    return false
  if (!href || href.startsWith('#'))
    return false
  if (isExternalOrNonSpaHref(href))
    return false
  return true
}

export function openExternalHref(href: string) {
  tracker.outboundClick({ url: href })
  window.open(href, '_blank', 'noopener,noreferrer')
}

/**
 * AutoLink / 正文委托点击共用的站内跳转与外链打开策略。
 */
export function navigateSpaOrExternal(router: Router, href: string) {
  if (href.startsWith('#'))
    return

  if (MAILTO_TEL_RE.test(href)) {
    window.location.href = href
    return
  }

  if (isExternalUrl(href)) {
    openExternalHref(href)
    return
  }

  void router.push(href)
}
