import type { HtmlTagDescriptor, Plugin } from 'vite'

const tags: HtmlTagDescriptor[] = [
  {
    tag: 'script',
    attrs: {
      charset: 'UTF-8',
      id: 'LA_COLLECT',
      src: '//sdk.51.la/js-sdk-pro.min.js'
    },
    injectTo: 'head'
  }
]

/**
 * 通过 `transformIndexHtml` 向 `index.html` 注入标签（定义于本文件 `tags`）。
 */
export default function HtmlHeadInject(): Plugin {
  return {
    name: 'html-head-inject',
    transformIndexHtml() {
      return { tags }
    }
  }
}
