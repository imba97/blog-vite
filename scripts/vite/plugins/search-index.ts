import type { Plugin } from 'vite'
import { generateSearchIndex } from '../../generate-search-index'

/**
 * 开发启动与每次构建前写入 public/search-*.json，随 Vite 拷贝至 dist。
 */
export default function searchIndexPlugin(): Plugin {
  let generating: Promise<void> | null = null

  async function runGenerate() {
    if (!generating)
      generating = generateSearchIndex('public').finally(() => { generating = null })
    await generating
  }

  return {
    name: 'vite-plugin-search-index',
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
