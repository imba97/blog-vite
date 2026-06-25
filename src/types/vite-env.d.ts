declare const __GIT_COMMIT_HASH__: string
declare const __GIT_COMMIT_SHORT_HASH__: string

// Vue SFC 默认模块声明（Vite Vue 插件只做 transform，未自动提供全局类型）
declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<object, object, unknown>
  export default component
}
