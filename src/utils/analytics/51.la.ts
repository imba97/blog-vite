declare const LA: any

export function initAnalytics() {
  if (!(globalThis as any).LA || import.meta.env.DEV) {
    return
  }

  LA.init({
    id: 'JYY17bPxMuIFHQwt',
    ck: 'JYY17bPxMuIFHQwt',
    hashMode: true
  })
}
