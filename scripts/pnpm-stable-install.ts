import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

function resolveNvmdNodePath(): string {
  const detected = spawnSync('pnpm', ['node', '-p', 'process.execPath'], {
    encoding: 'utf8'
  })

  if (detected.status === 0 && detected.stdout?.trim())
    return detected.stdout.trim()

  return process.execPath
}

function readNodeMajor(nodePath: string): number | null {
  const result = spawnSync(nodePath, ['-p', 'process.versions.node.split(".")[0]'], {
    encoding: 'utf8'
  })

  if (result.status !== 0)
    return null

  return Number(result.stdout.trim())
}

function compareVersion(a: string, b: string): number {
  const ap = a.split('.').map(Number)
  const bp = b.split('.').map(Number)
  const len = Math.max(ap.length, bp.length)

  for (let i = 0; i < len; i++) {
    const av = ap[i] || 0
    const bv = bp[i] || 0
    if (av !== bv)
      return av - bv
  }

  return 0
}

function resolveInstallNodePath(defaultNodePath: string): string {
  const versionDir = path.dirname(defaultNodePath)
  const nodesDir = path.dirname(versionDir)

  if (path.basename(nodesDir) !== 'nodes')
    return defaultNodePath

  const currentMajor = readNodeMajor(defaultNodePath)
  if (currentMajor === null || currentMajor < 24)
    return defaultNodePath

  const versions = fs.readdirSync(nodesDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && /^22\.\d+\.\d+$/.test(entry.name))
    .map(entry => entry.name)
    .sort(compareVersion)

  const fallbackVersion = versions.at(-1)
  if (!fallbackVersion)
    return defaultNodePath

  const fallbackNodePath = path.join(nodesDir, fallbackVersion, 'node.exe')
  const fallbackPnpmCliPath = path.join(nodesDir, fallbackVersion, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')

  if (!fs.existsSync(fallbackNodePath) || !fs.existsSync(fallbackPnpmCliPath))
    return defaultNodePath

  return fallbackNodePath
}

const pnpmNodePath = resolveNvmdNodePath()
const nodeExecPath = resolveInstallNodePath(pnpmNodePath)
const nodeDir = path.dirname(nodeExecPath)
const pnpmCliPath = path.join(nodeDir, 'node_modules', 'pnpm', 'bin', 'pnpm.cjs')

if (nodeExecPath !== pnpmNodePath)
  console.log(`[install:stable] Fallback to Node ${path.basename(nodeDir)} for pnpm install`)

if (!fs.existsSync(pnpmCliPath)) {
  console.error('[install:stable] Cannot find pnpm CLI script:', pnpmCliPath)
  console.error('[install:stable] Ensure nvmd node has pnpm installed.')
  process.exit(1)
}

const env = {
  ...process.env,
  NODE_OPTIONS: '--max-old-space-size=6144'
}

const args = [
  '--max-old-space-size=6144',
  pnpmCliPath,
  'install',
  '--config.manage-package-manager-versions=false',
  '--network-concurrency=4',
  '--child-concurrency=1'
]

const result = spawnSync(nodeExecPath, args, {
  stdio: 'inherit',
  env
})

if (result.error) {
  console.error('[install:stable] Failed to run install:', result.error.message)
  process.exit(1)
}

process.exit(result.status ?? 1)
