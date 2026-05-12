let scrollLockRefCount = 0
let preservedOverflow = ''

function isBrowser() {
  return typeof document !== 'undefined'
}

export function acquireBodyScrollLock() {
  if (!isBrowser())
    return
  scrollLockRefCount++
  if (scrollLockRefCount === 1) {
    preservedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}

export function releaseBodyScrollLock() {
  if (!isBrowser())
    return
  scrollLockRefCount = Math.max(0, scrollLockRefCount - 1)
  if (scrollLockRefCount === 0)
    document.body.style.overflow = preservedOverflow
}
