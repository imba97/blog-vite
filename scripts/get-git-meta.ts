import { execSync } from 'node:child_process'

const UNKNOWN_HASH = 'unknown'

export interface GitMeta {
  fullHash: string
  shortHash: string
}

export function getGitMeta(): GitMeta {
  try {
    const fullHash = execSync('git rev-parse HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    if (!/^[\da-f]{40}$/i.test(fullHash)) {
      throw new Error('Invalid git hash format')
    }

    return {
      fullHash,
      shortHash: fullHash.slice(0, 7)
    }
  }
  catch {
    return {
      fullHash: UNKNOWN_HASH,
      shortHash: UNKNOWN_HASH
    }
  }
}
