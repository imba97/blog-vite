import type { Plugin } from 'vite'
import { generateSiteSeo } from '../../generate-site-seo.ts'

/**
 * 开发启动与每次构建前，从 `seo/site.json` 生成
 * `.auto-generate/site-seo.ts` 与 `.auto-generate/site-faq.ts`。
 */
export default function siteSeoPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating)
      generating = generateSiteSeo().finally(() => { generating = null })
    await generating
  }

  return {
    name: 'vite-plugin-site-seo',
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
