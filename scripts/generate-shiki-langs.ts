import type { BundledLanguage } from 'shiki'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { bundledLanguagesInfo } from 'shiki'
import { shikiLangs as generatedShikiLangs } from '../src/generated/shiki-langs.ts'

/**
 * 扫描 `posts/**\/index.md` 中代码围栏使用的语言，归一化为 shiki 的规范语言 id，
 * 并校验 `src/generated/shiki-langs.ts` 是否与语料一致。
 *
 * 之所以需要它：`@shikijs/markdown-it` 未传 `langs` 时会加载 shiki 内置的全部 242 个语法包，
 * 初始化耗时数秒；显式声明实际用到的 17 个语法包后降到约 0.2 秒。
 * 代价是"新增未覆盖的语言"会让 shiki 抛错，本模块负责在构建前给出可读的错误信息。
 */

const POSTS_DIR = resolve('posts')
const GENERATED_FILE = resolve('src/generated/shiki-langs.ts')
/** `pnpm build` 忘记重新生成时，允许自动改写生成物并继续（CI 冷构建用） */
const AUTOFIX_ENV = 'SHIKI_LANGS_AUTOFIX'

/** 无需语法包的"纯文本"标识，shiki 会走零开销的 plain 快速路径 */
const PLAIN_LANGS = new Set(['text', 'plain', 'plaintext', 'txt'])

/**
 * 代码围栏的起始标记（逐行匹配）。三点注意：
 * 1) 不能带 /g —— 带 g 的正则会保留 lastIndex，逐行复用时绝大多数行都会漏匹配；
 * 2) 行尾 \r 已在 splitFrontmatter 里归一化掉，这里无需再处理；
 * 3) 信息串整体收进第二个分组、由代码 trim：不要在正则里再写 `[ \t]*`，
 *    否则空白量词与 `[^`~]*` 能互相交换字符，触发 regexp/no-super-linear-backtracking。
 */
const FENCE_RE = /^ {0,3}(`{3,}|~{3,})([^`~]*)$/

export interface FenceSite {
  /** 语料中出现的原始标识（已小写），如 `ts`、`objective-c` */
  raw: string
  /** 出现位置，格式 `posts/<目录>/index.md:<行号>` */
  where: string
  /** 围栏内的源码（仅 shiki-profile 需要，生成清单时不使用） */
  body?: string
}

export interface LangUsage {
  /** 规范语言 id → 围栏数量（含 `text`） */
  counts: Map<string, number>
  /** 原始标识 → 规范语言 id（含 `text`） */
  rawToCanonical: Map<string, string>
  /** 语料中出现过的不同原始标识总数（含未识别与 `text`） */
  rawTotal: number
  /** shiki 未内置的标识 */
  unknown: FenceSite[]
  /** 规范化后的所需语言列表（不含 `text`），已排序 */
  langs: string[]
  /** 代码围栏总数 */
  fences: number
}

/**
 * 拆出 front matter 之后的正文，并返回正文首行在原始文件中的行号（1 起）。
 * 保留行号偏移是为了让报错里的 `文件:行号` 与编辑器显示一致 —— 否则用户按行号找不到位置。
 * 顺带把 CRLF 归一化成 LF，避免 `$` 锚点被行尾 `\r` 破坏。
 */
function splitFrontmatter(raw: string): { body: string, offset: number } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  if (lines[0] !== '---')
    return { body: lines.join('\n'), offset: 0 }

  const end = lines.indexOf('---', 1)
  if (end === -1)
    return { body: lines.join('\n'), offset: 0 }

  // lines[end] 是结束定界符，正文从 end + 1 开始；它在原文里是第 end + 2 行
  return { body: lines.slice(end + 1).join('\n'), offset: end + 1 }
}

/** 按 CommonMark 围栏规则（同类字符、长度不短于开启围栏）逐行匹配 */
function fenceSitesIn(content: string, where: string, lineOffset: number, out: FenceSite[]): number {
  const lines = content.split('\n')
  const fenceRe = FENCE_RE
  let open: { char: string, len: number, site: FenceSite, bodyStart: number } | null = null
  let fences = 0

  for (let i = 0; i < lines.length; i++) {
    // 全角空格归一，避免 `\u3000ts` 这类写法被漏识别
    const line = lines[i].replaceAll('\u3000', ' ')
    const match = fenceRe.exec(line)
    if (!match)
      continue

    const [marker, info] = [match[1], match[2]]
    if (!open) {
      // 只取 info 的第一个 token：`ts {1,3-5}` / `js title="x"` 都只关心语言
      const lang = info.trim().split(/[\s{=]/)[0].toLowerCase()
      // i 是正文内的行下标，加上偏移换成原始文件行号
      const site: FenceSite = { raw: lang || 'text', where: `${where}:${lineOffset + i + 1}` }
      out.push(site)
      open = { char: marker[0], len: marker.length, site, bodyStart: i + 1 }
      fences += 1
      continue
    }

    if (marker[0] === open.char && marker.length >= open.len) {
      open.site.body = lines.slice(open.bodyStart, i).join('\n')
      open = null
    }
  }

  // 未闭合的围栏（CommonMark 下延伸到文末）
  if (open)
    open.site.body = lines.slice(open.bodyStart).join('\n')

  return fences
}

/** 扫描整份语料，得到语言使用情况（不依赖生成物，永远以语料为准） */
/** 扫出全部代码围栏（含围栏内源码），供 shiki 剖析与语言统计共用 */
export function listFences(postsDir = POSTS_DIR): FenceSite[] {
  if (!existsSync(postsDir))
    throw new Error(`[shiki-langs] 找不到文章目录：${postsDir}`)

  const sites: FenceSite[] = []
  for (const entry of readdirSync(postsDir, { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    const file = join(postsDir, entry.name, 'index.md')
    if (!existsSync(file))
      continue
    const { body, offset } = splitFrontmatter(readFileSync(file, 'utf8'))
    fenceSitesIn(body, `posts/${entry.name}/index.md`, offset, sites)
  }
  return sites
}

/** 扫描整份语料，得到语言使用情况（不依赖生成物，永远以语料为准） */
export function scanUsedShikiLangs(postsDir = POSTS_DIR): LangUsage {
  if (!existsSync(postsDir))
    throw new Error(`[shiki-langs] 找不到文章目录：${postsDir}`)

  const ids = new Set(bundledLanguagesInfo.map(i => i.id))
  const aliasToId = new Map<string, string>()
  for (const info of bundledLanguagesInfo) {
    for (const alias of info.aliases ?? [])
      aliasToId.set(alias, info.id)
  }

  const sites: FenceSite[] = []
  let fences = 0
  for (const entry of readdirSync(postsDir, { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    const file = join(postsDir, entry.name, 'index.md')
    if (!existsSync(file))
      continue
    const { body, offset } = splitFrontmatter(readFileSync(file, 'utf8'))
    fences += fenceSitesIn(body, `posts/${entry.name}/index.md`, offset, sites)
  }

  const counts = new Map<string, number>()
  const rawToCanonical = new Map<string, string>()
  const rawOrder: string[] = []
  const seenRaw = new Set<string>()
  const unknown: FenceSite[] = []

  for (const site of sites) {
    if (!seenRaw.has(site.raw)) {
      seenRaw.add(site.raw)
      rawOrder.push(site.raw)
    }

    const canonical = PLAIN_LANGS.has(site.raw)
      ? 'text'
      : (ids.has(site.raw) ? site.raw : aliasToId.get(site.raw))

    if (!canonical) {
      if (!unknown.some(u => u.raw === site.raw))
        unknown.push(site)
      continue
    }

    rawToCanonical.set(site.raw, canonical)
    counts.set(canonical, (counts.get(canonical) ?? 0) + 1)
  }
  const langs = [...counts.keys()].filter(id => id !== 'text').sort()
  return { counts, rawToCanonical, rawTotal: seenRaw.size, unknown, langs, fences }
}

export function renderReport(usage: LangUsage): string {
  const lines: string[] = []
  const loaded = usage.langs.length
  const total = bundledLanguagesInfo.length

  lines.push(`语料：${usage.fences} 个代码围栏`)
  lines.push('')
  lines.push('规范语言 id            围栏数   载入方式')
  lines.push('────────────────────────────────────────────')

  const rows = [...usage.counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  for (const [id, count] of rows) {
    const raws = [...usage.rawToCanonical.entries()].filter(([, c]) => c === id).map(([r]) => r)
    const alias = raws.filter(r => r !== id)
    const note = id === 'text'
      ? 'plain（无需语法包）'
      : (alias.length ? `别名 ${alias.join('/')}` : '直接命中')
    lines.push(`${id.padEnd(22)} ${String(count).padStart(5)}   ${note}`)
  }

  const distinct = usage.rawTotal
  lines.push('────────────────────────────────────────────')
  lines.push(`覆盖 ${distinct - usage.unknown.length}/${distinct} 个标识；需载入 ${loaded} 个语法包（内置 ${total} 个，-${Math.round((1 - loaded / total) * 100)}%）`)
  return lines.join('\n')
}

/** 按规范 id 汇总：`shellscript(168: bash/sh/shell)` */
function canonicalSummary(usage: LangUsage): { id: string, count: number, raws: string[] }[] {
  return [...usage.counts.entries()]
    .map(([id, count]) => ({
      id,
      count,
      raws: [...usage.rawToCanonical.entries()].filter(([, c]) => c === id).map(([r]) => r).sort()
    }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
}

export function renderGeneratedFile(usage: LangUsage, source: string): string {
  const banner: string[] = [
    `// This file is auto-generated by ${source} — do not edit by hand.`,
    '// 重新生成：pnpm run generate-langs',
    '// 该目录在 eslint.config.ts / tsconfig.json 中均已忽略',
    '//',
    '// 为什么需要它：@shikijs/markdown-it 不传 langs 时会加载 shiki 内置的全部语法包，',
    '// 初始化要数秒；这里只列 posts/ 实际用到的语言，覆盖范围由 generate-shiki-langs.ts 校验。',
    '//',
    '// 语料中的语言标识（括号内为围栏数，: 后为该规范 id 覆盖的别名）：'
  ]

  for (const { id, count, raws } of canonicalSummary(usage)) {
    if (id === 'text') {
      banner.push(`//   text(${count}) 走 shiki plain 快速路径，无需语法包`)
      continue
    }
    const alias = raws.filter(r => r !== id)
    banner.push(`//   ${id}(${count})${alias.length ? `: ${alias.join('/')}` : ''}`)
  }

  const list = usage.langs.map(id => `'${id}'`).join(', ')
  return [
    ...banner,
    '',
    `export const shikiLangs = [${list}] as const`,
    '',
    'export type ShikiLang = (typeof shikiLangs)[number]',
    ''
  ].join('\n')
}

export function readUsageMarkdown(): string {
  return renderReport(scanUsedShikiLangs())
}

function formatUnknown(sites: FenceSite[]): string {
  return sites
    .map(site => `  - \`${site.raw}\` 于 ${site.where}`)
    .join('\n')
}

/**
 * 语料里出现了 shiki 未内置（且不是任何内置语言别名）的标识时，抛出可读的错误。
 * 注意：这里只拦"shiki 根本没有"的情况；"shiki 有但生成物没收录"由 resolveShikiLangs
 * 的不一致分支处理，那条路径会给出 `pnpm run generate-langs` 的指引。
 */
function assertKnownLangs(usage: LangUsage): void {
  if (usage.unknown.length === 0)
    return

  throw new Error([
    '[shiki-langs] posts/ 中使用了 shiki 未内置的代码块语言：',
    formatUnknown(usage.unknown),
    '',
    '处理方式：',
    '  1. 改用 shiki 已支持的语言（可在 shiki 文档的 Languages 列表里查规范名）',
    '  2. 或为该语言提供自定义 grammar，并在 vite.config.ts 里加载'
  ].join('\n'))
}

/**
 * 校验语料与生成物一致，返回可直接传给 `MarkdownItShiki({ langs })` 的数组。
 * 设置 `SHIKI_LANGS_AUTOFIX=1` 时，不一致会自动改写生成物并继续构建（CI 冷构建兜底）。
 */
export function resolveShikiLangs(): BundledLanguage[] {
  const usage = scanUsedShikiLangs()
  assertKnownLangs(usage)

  const current = [...generatedShikiLangs] as BundledLanguage[]
  const same = current.length === usage.langs.length && current.every((id, i) => id === usage.langs[i])

  if (same)
    return current

  const added = usage.langs.filter(id => !current.includes(id as BundledLanguage))
  const removed = current.filter(id => !usage.langs.includes(id))

  if (process.env[AUTOFIX_ENV] === '1') {
    writeGeneratedFile(usage)
    console.warn(`[shiki-langs] 生成物已自动更新：新增 ${added.join(', ') || '无'}；移除 ${removed.join(', ') || '无'}`)
    return usage.langs as BundledLanguage[]
  }

  throw new Error([
    '[shiki-langs] src/generated/shiki-langs.ts 与语料不一致。',
    `  语料需要但生成物缺失：${added.join(', ') || '无'}`,
    `  生成物多余：${removed.join(', ') || '无'}`,
    '',
    '处理方式：执行 `pnpm run generate-langs`（或在 CI 设置 SHIKI_LANGS_AUTOFIX=1 自动改写）'
  ].join('\n'))
}

/** 重新生成 `src/generated/shiki-langs.ts` */
export function writeGeneratedFile(usage = scanUsedShikiLangs(), source = 'scripts/generate-shiki-langs.ts'): void {
  assertKnownLangs(usage)
  writeFileSync(GENERATED_FILE, renderGeneratedFile(usage, source), 'utf8')
}
