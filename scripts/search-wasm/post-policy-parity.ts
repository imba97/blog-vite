import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import matter from '@11ty/gray-matter'
import { postPublicPath } from '../../src/constants/route-policy.ts'
import {
  formatPostDateString,
  isPublishablePostData,
  normalizeNumericPostId,
  normalizeStringList
} from '../../src/content/post-policy.ts'

/**
 * 发布规则一致性校验：拿 Rust 仓库的 `testdata/post-policy-vectors.json`，
 * 用**本仓库真实的** gray-matter + post-policy 跑一遍，逐条比对期望值。
 *
 * 对应的 Rust 实现是 `posts::evaluate_frontmatter`（由 `tests/post_policy_vectors.rs` 校验同一份向量）。
 * 这个校验存在的意义：Rust 直读文章时会自己解析 frontmatter 并应用发布规则，
 * 一旦两边规则漂移，「wasm 索引」与「MiniSearch 回退索引」收录的文章就会不一致，且极难发现。
 */

interface PolicyCase {
  name: string
  frontmatter: string
  expected: {
    publishable: boolean
    reject_reason?: string
    id?: string
    path?: string
    title?: string
    date?: string
    tags?: string[]
    categories?: string[]
  }
}

interface PolicyVectors {
  version: number
  cases: PolicyCase[]
}

export interface PolicyParityResult {
  passed: number
  failures: string[]
  version: number
}

function parseFrontmatterCase(frontmatter: string): Record<string, unknown> {
  const document = frontmatter.trim() === '' ? '---\n---\n' : `---\n${frontmatter}\n---\n`
  return matter(document).data as Record<string, unknown>
}

export function runPostPolicyParity(vectorsPath: string): PolicyParityResult {
  const vectors = JSON.parse(readFileSync(vectorsPath, 'utf-8')) as PolicyVectors
  const failures: string[] = []
  let passed = 0

  for (const item of vectors.cases) {
    const data = parseFrontmatterCase(item.frontmatter)
    const publishable = isPublishablePostData(data)
    const problems: string[] = []

    if (publishable !== item.expected.publishable) {
      problems.push(`publishable 期望 ${item.expected.publishable} 实际 ${publishable}`)
    }
    else if (publishable) {
      const id = normalizeNumericPostId(data)
      const actual = {
        id: id ?? '',
        path: id ? postPublicPath(id) : '',
        title: String(data.title ?? ''),
        date: formatPostDateString(data.date),
        tags: normalizeStringList(data.tags),
        categories: normalizeStringList(data.categories)
      }
      const expected = item.expected
      if (actual.id !== (expected.id ?? ''))
        problems.push(`id 期望 ${JSON.stringify(expected.id)} 实际 ${JSON.stringify(actual.id)}`)
      if (actual.path !== (expected.path ?? ''))
        problems.push(`path 期望 ${JSON.stringify(expected.path)} 实际 ${JSON.stringify(actual.path)}`)
      if (actual.title !== (expected.title ?? ''))
        problems.push(`title 期望 ${JSON.stringify(expected.title)} 实际 ${JSON.stringify(actual.title)}`)
      if (actual.date !== (expected.date ?? ''))
        problems.push(`date 期望 ${JSON.stringify(expected.date)} 实际 ${JSON.stringify(actual.date)}`)
      if (JSON.stringify(actual.tags) !== JSON.stringify(expected.tags ?? []))
        problems.push(`tags 期望 ${JSON.stringify(expected.tags)} 实际 ${JSON.stringify(actual.tags)}`)
      if (JSON.stringify(actual.categories) !== JSON.stringify(expected.categories ?? []))
        problems.push(`categories 期望 ${JSON.stringify(expected.categories)} 实际 ${JSON.stringify(actual.categories)}`)
    }

    if (problems.length === 0) {
      passed += 1
    }
    else {
      failures.push(`[${item.name}] ${problems.join('；')}`)
    }
  }

  return { passed, failures, version: vectors.version }
}

const invokedDirectly = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (invokedDirectly) {
  const target = process.argv[2]
  if (!target) {
    console.error('用法：esno ./scripts/search-wasm/post-policy-parity.ts <post-policy-vectors.json>')
    process.exit(1)
  }
  const result = runPostPolicyParity(target)
  if (result.failures.length > 0) {
    console.error(`[post-policy] ${result.failures.length} 个用例不一致（向量版本 ${result.version}）：`)
    for (const failure of result.failures)
      console.error(`  ${failure}`)
    process.exit(1)
  }
  console.log(`[post-policy] 发布规则一致性通过：${result.passed} 个用例（向量版本 ${result.version}）`)
}
