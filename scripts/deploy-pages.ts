import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
/**
 * 把 dist 同步到 Cloudflare Pages
 *
 * 用法：
 *   $env:CLOUDFLARE_API_TOKEN="..."; pnpm run deploy:pages
 *   pnpm run deploy:pages -- --dry-run
 *
 * 说明：
 * - 与项目其他脚本一致，用 esno 直接执行 TS，不需要编译
 * - 通过 spawnSync 调起 wrangler，并让子进程继承 stdio，
 *   交互式登录、进度输出都能正常显示
 */
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const PROJECT_NAME = 'imba97-blog'
const BRANCH = 'production'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(projectRoot, 'dist')

function log(message: string): void {
  console.log(message)
}

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

if (!existsSync(distDir))
  fail('找不到 dist 目录，请先执行 pnpm run build:pages')

if (!process.env.CLOUDFLARE_API_TOKEN && !isDryRun)
  log('⚠ 未检测到 CLOUDFLARE_API_TOKEN，wrangler 可能要求交互式登录')

const deployArgs = [
  'dlx',
  'wrangler',
  'pages',
  'deploy',
  'dist',
  `--project-name=${PROJECT_NAME}`,
  `--branch=${BRANCH}`
]

// 手动触发时允许多带一个 --commit-dirty，避免 wrangler 因工作区不干净报错
if (args.includes('--commit-dirty'))
  deployArgs.push('--commit-dirty=true')

if (isDryRun) {
  log('[dry-run] 将执行：')
  log(`  pnpm ${deployArgs.join(' ')}`)
  process.exit(0)
}

log(`==> 部署 dist 到 Cloudflare Pages (project=${PROJECT_NAME}, branch=${BRANCH})`)

const result = spawnSync('pnpm', deployArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  // Windows 下 pnpm 是 .cmd，需要 shell 才能解析
  shell: process.platform === 'win32'
})

if (result.error)
  fail(`启动 wrangler 失败：${result.error.message}`)

if (result.status !== 0)
  fail(`wrangler pages deploy 失败，退出码 ${result.status ?? '未知'}`)

log('==> 完成')
