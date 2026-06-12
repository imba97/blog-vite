import { LA_SITE_ID } from './config'

declare const LA: any

export function initLaAnalytics() {
  if (!(globalThis as any).LA)
    return

  LA.init({
    id: LA_SITE_ID,
    ck: LA_SITE_ID,
    hashMode: true
  })
}
