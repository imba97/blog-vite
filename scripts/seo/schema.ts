/**
 * GEO 元数据的字段约束与校验。
 *
 * 长度口径与主流 GEO 检测工具对齐：
 * - `description` 120–160 字符（OG / meta / JSON-LD / llms.txt 共用同一份）
 * - `keywords` 3–8 个
 *
 * 校验分两档：`error` 阻断写入 / 构建，`warn` 只提示。
 */
import type { PostSeo, SeoStatus } from '../../src/types/seo.ts'

export const SEO_LIMITS = {
  description: { min: 120, max: 160 },
  keywords: { min: 3, max: 8, itemMax: 30 }
} as const

export interface SeoIssue {
  field: string
  level: 'error' | 'warn'
  message: string
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

/** 去重、去空、统一空白；保证写回磁盘的文件稳定可 diff */
export function normalizePostSeo(input: Record<string, unknown>): PostSeo {
  const status = input.status === 'done' || input.status === 'draft' ? input.status as SeoStatus : undefined
  const reviewedAt = typeof input.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.reviewedAt.trim())
    ? input.reviewedAt.trim()
    : undefined

  return {
    description: typeof input.description === 'string' ? input.description.trim().replace(/\s+/g, ' ') : '',
    keywords: trimList(input.keywords as string[] | undefined),
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
    if (!Array.isArray(entry.keywords) || entry.keywords.some(item => typeof item !== 'string'))
      issues.push({ field: 'keywords', level: 'error', message: 'keywords 必须是字符串数组' })
    else if (entry.keywords.length < SEO_LIMITS.keywords.min || entry.keywords.length > SEO_LIMITS.keywords.max)
      issues.push({ field: 'keywords', level: 'warn', message: `keywords 为 ${entry.keywords.length} 个，建议 ${SEO_LIMITS.keywords.min}–${SEO_LIMITS.keywords.max}` })
    else if (entry.keywords.some(item => charLength(item) > SEO_LIMITS.keywords.itemMax))
      issues.push({ field: 'keywords', level: 'warn', message: `单个 keyword 不应超过 ${SEO_LIMITS.keywords.itemMax} 字符` })
  }

  return issues
}
