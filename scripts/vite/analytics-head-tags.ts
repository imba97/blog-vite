import type { HtmlTagDescriptor } from 'vite'
import { GA_MEASUREMENT_ID } from '../../src/utils/analytics/config'

export const analyticsHeadTags: HtmlTagDescriptor[] = [
  {
    // 51.la SDK：defer 让脚本在 HTML 解析完成后执行，避免阻塞首屏渲染
    tag: 'script',
    attrs: {
      charset: 'UTF-8',
      id: 'LA_COLLECT',
      src: 'https://sdk.51.la/js-sdk-pro.min.js',
      defer: true
    },
    injectTo: 'head'
  },
  {
    // gtag.js：与 51.la 并行下载，不阻塞 HTML 解析
    tag: 'link',
    attrs: {
      rel: 'preconnect',
      href: 'https://www.googletagmanager.com'
    },
    injectTo: 'head'
  },
  {
    tag: 'script',
    attrs: {
      defer: true,
      src: `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    },
    injectTo: 'head'
  },
  {
    tag: 'script',
    children: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `,
    injectTo: 'head'
  }
]
