import type { HtmlTagDescriptor } from 'vite'
import { GA_MEASUREMENT_ID } from '../../src/utils/analytics/config'

// 51la、GA 的 SDK 脚本均由 AnalyticsAdapter 基类在浏览器端动态注入，
// 此处只保留 GA 的 preconnect 优化与 inline gtag 初始化（必须在 SDK 之前定义 dataLayer）
export const analyticsHeadTags: HtmlTagDescriptor[] = [
  {
    // preconnect：提前建立到 GTM 的 TCP/TLS 握手，加速 gtag.js 下载
    tag: 'link',
    attrs: {
      rel: 'preconnect',
      href: 'https://www.googletagmanager.com'
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
