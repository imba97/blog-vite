import type { Plugin } from 'vite'
import { generateSitemap } from '../../generate-sitemap.ts'

/**
 * 开发启动与每次构建前写入 `public/sitemap.xml`，随 Vite 拷贝到 dist/。
 * 失败仅警告，不阻塞构建。
 */
export default function sitemapPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating) {
      generating = (async () => {
        try {
          const stats = await generateSitemap()
          console.log(
            `[sitemap] public/sitemap.xml · ${stats.entries} 条 · ${(stats.bytes / 1024).toFixed(1)} KiB`
          )
        }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`[sitemap] 生成失败（继续构建）：${message}`)
        }
      })().finally(() => {
        generating = null
      })
    }
    await generating
  }

  return {
    name: 'vite-plugin-sitemap',
    async buildStart() {
      await runGenerate()
    },
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        void runGenerate()
      })
    }
  }
}
