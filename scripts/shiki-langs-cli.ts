import process from 'node:process'
import { createHighlighter } from 'shiki'
import { shikiLangs } from '../src/generated/shiki-langs.ts'
import { listFences, readUsageMarkdown, renderReport, scanUsedShikiLangs, writeGeneratedFile } from './generate-shiki-langs.ts'

/**
 * shiki 语言清单的生成 / 校验 / 性能剖析入口。
 *
 *   pnpm run generate-langs              重新生成 src/generated/shiki-langs.ts
 *   pnpm run generate-langs -- --check   只校验不写盘（CI 用）
 *   pnpm run shiki-profile               剖析高亮器初始化与渲染耗时
 */

const args = new Set(process.argv.slice(2))

if (args.has('--check')) {
  const scanned = scanUsedShikiLangs()
  const current = [...shikiLangs] as string[]
  const same = current.length === scanned.langs.length && current.every((id, i) => id === scanned.langs[i])

  console.log(renderReport(scanned))
  if (!same) {
    console.error('\n[shiki-langs] 生成物与语料不一致，请执行 pnpm run generate-langs')
    console.error(`  语料需要：${scanned.langs.join(', ')}`)
    console.error(`  生成物：  ${current.join(', ')}`)
    process.exit(1)
  }
  console.log('\n[shiki-langs] 生成物与语料一致')
}
else if (args.has('--profile')) {
  await profile()
}
else {
  writeGeneratedFile()
  console.log(readUsageMarkdown())
  console.log('\n已写入 src/generated/shiki-langs.ts')
}

/**
 * 剖析高亮器：初始化耗时 / 全量语料渲染耗时 / RSS。
 * 这两个数是判断 `langs` 白名单收益的依据（改前：初始化 5~6.5 s、渲染 1.8~2.1 s）。
 */
async function profile(): Promise<void> {
  const themes = { dark: 'vitesse-dark', light: 'vitesse-light' }
  const opts = { themes, defaultColor: false as const, cssVariablePrefix: '--s-' }

  const t0 = performance.now()
  const highlighter = await createHighlighter({ themes: Object.values(themes), langs: [...shikiLangs] })
  const initMs = performance.now() - t0

  const usage = scanUsedShikiLangs()
  const fences = listFences()
  const codeBytes = fences.reduce((n, f) => n + (f.body?.length ?? 0), 0)

  // 用与 vite.config.ts 相同的双主题 + 变量前缀配置渲染全量围栏
  const resolve = (raw: string): string => usage.rawToCanonical.get(raw) ?? 'text'
  const render = (): number => {
    let bytes = 0
    for (const fence of fences)
      bytes += highlighter.codeToHtml(fence.body ?? '', { ...opts, lang: resolve(fence.raw) }).length
    return bytes
  }

  render()
  const samples: number[] = []
  for (let i = 0; i < 5; i++) {
    const t = performance.now()
    render()
    samples.push(performance.now() - t)
  }
  samples.sort((a, b) => a - b)

  console.log(`已加载语言：${(highlighter.getLoadedLanguages() as string[]).length} 个（shiki 内置共 242 个）`)
  console.log(`代码围栏：${fences.length} 个，${(codeBytes / 1024).toFixed(0)} KiB 源码`)
  console.log(`高亮器初始化：${initMs.toFixed(0)} ms`)
  console.log(`全量渲染：median ${samples[2].toFixed(0)} ms（min ${samples[0].toFixed(0)} ms）`)
  console.log(`进程 RSS：${(process.memoryUsage().rss / 1024 / 1024).toFixed(0)} MiB`)
  highlighter.dispose()
}
