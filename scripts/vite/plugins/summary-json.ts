import type { Plugin } from 'vite'
import { generateSummaryJson } from '../../generate-summary-json.ts'

/**
 * 开发启动与每次构建前写入 `public/summary.json`（机器可读的站点清单），
 * 随 Vite 自动拷贝到 dist/，供 AI 检索与 GEO 检测抓取。
 *
 * 失败仅警告，不阻塞构建。
 */
export default function summaryJsonPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating) {
      generating = (async () => {
        try {
          const stats = await generateSummaryJson('public')
          console.log(`[summary] public/summary.json (${(stats.bytes / 1024).toFixed(1)} KiB) · ${stats.posts} 篇`)
        }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`[summary] 生成失败（继续构建）：${message}`)
        }
      })().finally(() => {
        generating = null
      })
    }
    await generating
  }

  return {
    name: 'vite-plugin-summary-json',
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
