import { spawnSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'

function getPnpmNodePath(): string {
  const result = spawnSync('pnpm', ['node', '-p', 'process.execPath'], {
    encoding: 'utf8'
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

function readNodeVersion(nodePath: string): string {
  if (!nodePath)
    return ''

  const result = spawnSync(nodePath, ['-p', 'process.versions.node'], {
    encoding: 'utf8'
  })

  return result.status === 0 ? result.stdout.trim() : ''
}

const shellNodePath = process.execPath
const pnpmNodePath = getPnpmNodePath()

console.log('shellNodePath', shellNodePath)
console.log('shellNodeVersion', process.version)
console.log('shellNodeArch', process.arch)
console.log('NODE_OPTIONS', process.env.NODE_OPTIONS || '')
console.log('pnpmNodePath', pnpmNodePath || '(unavailable)')
console.log('pnpmNodeVersion', readNodeVersion(pnpmNodePath) || '(unavailable)')
console.log('pnpmVersion', spawnSync('pnpm', ['-v'], { encoding: 'utf8' }).stdout.trim())

if (pnpmNodePath && pnpmNodePath !== shellNodePath) {
  console.log('warning', 'node path mismatch between shell and pnpm')
  console.log('shellNodeDir', path.dirname(shellNodePath))
  console.log('pnpmNodeDir', path.dirname(pnpmNodePath))
}
