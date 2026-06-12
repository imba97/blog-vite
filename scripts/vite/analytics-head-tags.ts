import type { HtmlTagDescriptor } from 'vite'
import { GA_MEASUREMENT_ID } from '../../src/utils/analytics/config'

export const analyticsHeadTags: HtmlTagDescriptor[] = [
  {
    tag: 'script',
    attrs: {
      charset: 'UTF-8',
      id: 'LA_COLLECT',
      src: 'https://sdk.51.la/js-sdk-pro.min.js'
    },
    injectTo: 'head'
  },
  {
    tag: 'script',
    attrs: {
      async: true,
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
