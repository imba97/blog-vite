/**
 * GEO 元数据的字段约束与校验。
 *
 * 长度口径与主流 GEO 检测工具对齐：
 * - `description` 120–160 字符（OG / meta / JSON-LD 共用同一份）
 * - `keywords` 3–8 个
 * - `keyPoints` 2–6 条
 * - `faq` 最多 5 条，question 6–60 字符，answer 20–300 字符
 *
 * 校验分两档：`error` 阻断写入 / 构建，`warn` 只提示。
 */
import type { PostSeo, SeoFaqItem, SeoStatus } from '../../src/types/seo.ts'

export const SEO_LIMITS = {
  description: { min: 120, max: 160 },
  keywords: { min: 3, max: 8, itemMax: 30 },
  keyPoints: { min: 2, max: 6, itemMin: 8, itemMax: 80 },
  faq: { max: 5, questionMin: 6, questionMax: 60, answerMin: 20, answerMax: 300 },
  about: { max: 5 },
  citations: { max: 8 }
} as const

export interface SeoIssue {
  field: string
  level: 'error' | 'warn'
  message: string
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}

function charLength(value: string): number {
  return [...value].length
}

function trimList(list: string[] | undefined): string[] | undefined {
  if (!Array.isArray(list))
    return undefined
  const cleaned = [...new Set(list.map(item => item.trim()).filter(Boolean))]
  return cleaned.length > 0 ? cleaned : undefined
}

function normalizeFaq(faq: SeoFaqItem[] | undefined): SeoFaqItem[] | undefined {
  if (!Array.isArray(faq))
    return undefined
  const cleaned = faq
    .map(item => ({
      question: typeof item?.question === 'string' ? item.question.trim() : '',
      answer: typeof item?.answer === 'string' ? item.answer.trim() : ''
    }))
    .filter(item => item.question && item.answer)
  return cleaned.length > 0 ? cleaned : undefined
}

/** 去重、去空、统一换行；保证写回磁盘的文件稳定可 diff */
export function normalizePostSeo(input: Record<string, unknown>): PostSeo {
  const status = input.status === 'done' || input.status === 'draft' ? input.status as SeoStatus : undefined
  const reviewedAt = typeof input.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.reviewedAt.trim())
    ? input.reviewedAt.trim()
    : undefined

  return {
    description: typeof input.description === 'string' ? input.description.trim().replace(/\s+/g, ' ') : '',
    keywords: trimList(input.keywords as string[] | undefined),
    keyPoints: trimList(input.keyPoints as string[] | undefined),
    faq: normalizeFaq(input.faq as SeoFaqItem[] | undefined),
    about: trimList(input.about as string[] | undefined),
    citations: trimList(input.citations as string[] | undefined),
    reviewedAt,
    status
  }
}

/** 校验单篇文章元数据 */
export function validatePostSeo(entry: PostSeo, options: { strict?: boolean } = {}): SeoIssue[] {
  const issues: SeoIssue[] = []
  const strict = options.strict ?? entry.status === 'done'

  const description = entry.description.trim()
  const descriptionLength = charLength(description)
  if (!description) {
    issues.push({ field: 'description', level: strict ? 'error' : 'warn', message: '缺少 description' })
  }
  else if (descriptionLength < SEO_LIMITS.description.min || descriptionLength > SEO_LIMITS.description.max) {
    issues.push({
      field: 'description',
      level: strict ? 'error' : 'warn',
      message: `description 为 ${descriptionLength} 字符，应为 ${SEO_LIMITS.description.min}–${SEO_LIMITS.description.max}`
    })
  }

  if (entry.keywords) {
    if (!isStringArray(entry.keywords))
      issues.push({ field: 'keywords', level: 'error', message: 'keywords 必须是字符串数组' })
    else if (entry.keywords.length < SEO_LIMITS.keywords.min || entry.keywords.length > SEO_LIMITS.keywords.max)
      issues.push({ field: 'keywords', level: 'warn', message: `keywords 为 ${entry.keywords.length} 个，建议 ${SEO_LIMITS.keywords.min}–${SEO_LIMITS.keywords.max}` })
    else if (entry.keywords.some(item => charLength(item) > SEO_LIMITS.keywords.itemMax))
      issues.push({ field: 'keywords', level: 'warn', message: `单个 keyword 不应超过 ${SEO_LIMITS.keywords.itemMax} 字符` })
  }

  if (entry.keyPoints) {
    if (!isStringArray(entry.keyPoints))
      issues.push({ field: 'keyPoints', level: 'error', message: 'keyPoints 必须是字符串数组' })
    else if (entry.keyPoints.length < SEO_LIMITS.keyPoints.min || entry.keyPoints.length > SEO_LIMITS.keyPoints.max)
      issues.push({ field: 'keyPoints', level: 'warn', message: `keyPoints 为 ${entry.keyPoints.length} 条，建议 ${SEO_LIMITS.keyPoints.min}–${SEO_LIMITS.keyPoints.max}` })
    else if (entry.keyPoints.some(item => charLength(item) > SEO_LIMITS.keyPoints.itemMax))
      issues.push({ field: 'keyPoints', level: 'warn', message: `单条要点不应超过 ${SEO_LIMITS.keyPoints.itemMax} 字符` })
  }

  if (entry.faq) {
    if (!Array.isArray(entry.faq)) {
      issues.push({ field: 'faq', level: 'error', message: 'faq 必须是数组' })
    }
    else if (entry.faq.length > SEO_LIMITS.faq.max) {
      issues.push({ field: 'faq', level: 'warn', message: `faq 最多 ${SEO_LIMITS.faq.max} 条` })
    }
    else {
      entry.faq.forEach((item, index) => {
        const qLength = charLength(item.question)
        const aLength = charLength(item.answer)
        if (qLength < SEO_LIMITS.faq.questionMin || qLength > SEO_LIMITS.faq.questionMax)
          issues.push({ field: `faq[${index}].question`, level: 'warn', message: `问题为 ${qLength} 字符，应为 ${SEO_LIMITS.faq.questionMin}–${SEO_LIMITS.faq.questionMax}` })
        if (aLength < SEO_LIMITS.faq.answerMin || aLength > SEO_LIMITS.faq.answerMax)
          issues.push({ field: `faq[${index}].answer`, level: 'warn', message: `答案可能偏离 ${SEO_LIMITS.faq.answerMin}–${SEO_LIMITS.faq.answerMax} 字符` })
      })
    }
  }

  if (entry.citations && entry.citations.length > SEO_LIMITS.citations.max)
    issues.push({ field: 'citations', level: 'warn', message: `citations 最多 ${SEO_LIMITS.citations.max} 条` })

  return issues
}
