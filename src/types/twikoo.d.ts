declare module 'twikoo' {
  export interface TwikooInitOptions {
    envId: string
    el: string
    path?: string
  }

  export interface TwikooApi {
    init: (options: TwikooInitOptions) => Promise<unknown> | unknown
  }

  const twikoo: TwikooApi
  export default twikoo
}
