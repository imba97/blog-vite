import type { Plugin } from 'vite'
import { generatePostsMeta } from '../../generate-posts-meta'

/**
 * 开发启动与每次构建前写入 `.auto-generate/posts-meta.ts`。
 */
export default function postsMetaPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating)
      generating = generatePostsMeta().finally(() => { generating = null })
    await generating
  }

  return {
    name: 'vite-plugin-posts-meta',
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
