import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { miniSearchTokenizer } from 'bigseek'

/**
 * 分词一致性校验：拿 bigseek 仓库的 `testdata/tokenize-vectors.json` 逐条比对**已安装的
 * `bigseek` 包**里的 TS 实现。
 *
 * WASM 索引是主引擎、包内的 TS 分词是 MiniSearch 回退路径，两者语义必须一致，
 * 否则「降级」会把召回率从 100% 打回 39.7%。这个校验在 `pnpm run search:wasm` 里会顺带跑，
 * 校验的正是运行期实际会加载的那份代码。
 */

interface TokenizeVectorCase {
  name: string
  input: string
  normalized: string
  tokens: string[]
}

interface TokenizeVectors {
  version: number
  cases: TokenizeVectorCase[]
}

export interface ParityResult {
  passed: number
  failures: string[]
  version: number
}

export function runParityCheck(vectorsPath: string): ParityResult {
  const vectors = JSON.parse(readFileSync(vectorsPath, 'utf-8')) as TokenizeVectors
  const failures: string[] = []
  let passed = 0

  for (const item of vectors.cases) {
    // 只比对分词结果：TS 侧的分词器接收原文（与 MiniSearch 的 tokenize 签名一致），
    // 归一化在其内部完成，所以这里用同一个入口
    const actual = miniSearchTokenizer(item.input)
    if (actual.length === item.tokens.length && actual.every((token, i) => token === item.tokens[i])) {
      passed += 1
    }
    else {
      failures.push(
        `[${item.name}] 输入 ${JSON.stringify(item.input)}\n    期望 ${JSON.stringify(item.tokens)}\n    实际 ${JSON.stringify(actual)}`
      )
    }
  }

  return { passed, failures, version: vectors.version }
}

/** 直接运行时：`esno ./scripts/search-wasm/parity.ts <vectors.json>` */
const invokedDirectly = process.argv[1] !== undefined
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (invokedDirectly) {
  const target = process.argv[2]
  if (!target) {
    console.error('用法：esno ./scripts/search-wasm/parity.ts <tokenize-vectors.json>')
    process.exit(1)
  }
  const result = runParityCheck(target)
  if (result.failures.length > 0) {
    console.error(`[parity] ${result.failures.length} 个用例不一致（向量版本 ${result.version}）：`)
    for (const failure of result.failures)
      console.error(`  ${failure}`)
    process.exit(1)
  }
  console.log(`[parity] 分词一致性通过：${result.passed} 个用例（向量版本 ${result.version}）`)
}
