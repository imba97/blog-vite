import type { Plugin } from 'vite'
import { generateLlmsTxt } from '../../generate-llms-txt.ts'

/**
 * 开发启动与每次构建前写入 `public/llms.txt` 与 `public/llms-full.txt`，
 * 随 Vite 自动拷贝到 dist/，供 LLM / 生成式检索抓取。
 *
 * 失败仅警告，不阻塞构建：GEO 是渐进增量，单次失败不应阻断站点发布。
 */
export default function llmsTxtPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating) {
      generating = (async () => {
        try {
          const stats = await generateLlmsTxt('public')
          console.log(
            `[llms-txt] public/llms.txt (${(stats.llmsBytes / 1024).toFixed(1)} KiB)`
            + ` · public/llms-full.txt (${(stats.llmsFullBytes / 1024).toFixed(1)} KiB)`
            + ` · ${stats.posts} 篇`
          )
        }
        catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          console.warn(`[llms-txt] 生成失败（继续构建）：${message}`)
        }
      })().finally(() => {
        generating = null
      })
    }
    await generating
  }

  return {
    name: 'vite-plugin-llms-txt',
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
