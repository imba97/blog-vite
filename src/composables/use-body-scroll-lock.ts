let scrollLockRefCount = 0
let preservedBodyOverflow = ''
let preservedHtmlOverflow = ''

function isBrowser() {
  return typeof document !== 'undefined'
}

export function acquireBodyScrollLock() {
  if (!isBrowser())
    return
  scrollLockRefCount++
  if (scrollLockRefCount === 1) {
    preservedBodyOverflow = document.body.style.overflow
    preservedHtmlOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }
}

export function releaseBodyScrollLock() {
  if (!isBrowser())
    return
  scrollLockRefCount = Math.max(0, scrollLockRefCount - 1)
  if (scrollLockRefCount === 0) {
    document.documentElement.style.overflow = preservedHtmlOverflow
    document.body.style.overflow = preservedBodyOverflow
  }
}
