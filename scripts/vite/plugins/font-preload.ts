import type { HtmlTagDescriptor, Plugin } from 'vite'

/**
 * 读取构建产物中的 CSS，定位指向 latin 基字符集（unicode-range U+?? 开头）
 * 的 woff2 文件，作为首屏关键字体在 <head> 中以 `<link rel="preload">` 注入。
 *
 * UnoCSS preset-web-fonts 在打包后会将同一字体的不同 unicode 子集拆成多个 woff2，
 * 其中 `unicode-range:U+??` 起始的为拉丁基本字符集，是首屏文字渲染必须加载的。
 */
export default function FontPreload(): Plugin {
  let publicAssetsDir: string = ''
  // 匹配指向 latin 基字符集（unicode-range U+?? 开头）的 woff2 文件
  // 注意：src 与 unicode-range 的先后顺序在 CSS 中不固定，正则需兼容两种
  const targetFontRegex = /@font-face\{(?=[^}]*unicode-range:U\+\?\?)[^}]*src:url\(\/assets\/fonts\/([a-z0-9-]+\.woff2)\)/g

  return {
    name: 'font-preload',
    apply: 'build',
    configResolved(config) {
      publicAssetsDir = config.build.outDir
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!publicAssetsDir)
          return html

        // 通过 ctx.bundle 拿到所有 CSS 资源
        const bundles = ctx.bundle ?? {}
        const fontUrls = new Set<string>()

        for (const fileName of Object.keys(bundles)) {
          if (!fileName.endsWith('.css'))
            continue
          const asset = bundles[fileName]
          if (asset.type !== 'asset')
            continue
          const css = asset.source.toString()
          // 重置 regex lastIndex（g 标志在循环里会持续推进）
          targetFontRegex.lastIndex = 0
          for (const match of css.matchAll(targetFontRegex)) {
            fontUrls.add(`/assets/fonts/${match[1]}`)
          }
        }

        const tags: HtmlTagDescriptor[] = []

        // 关键 woff2：preload 让浏览器尽早发起字体下载，避免阻塞首字渲染
        for (const href of fontUrls) {
          tags.push({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href,
              crossorigin: 'anonymous'
            },
            injectTo: 'head'
          })
        }

        // 入口脚本 fetchpriority='high'：提示浏览器优先调度首屏关键 JS
        const entryMatch = html.match(/<script\s+type="module"[^>]*src="(\/assets\/entry-[^"]+\.js)"[^>]*>/)
        if (entryMatch) {
          html = html.replace(
            entryMatch[0],
            entryMatch[0].replace('<script ', '<script fetchpriority="high" ')
          )
        }

        return { html, tags }
      }
    }
  }
}
