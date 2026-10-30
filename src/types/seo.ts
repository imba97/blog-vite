/**
 * GEO / SEO 元数据形状。
 *
 * 这层数据从文章 frontmatter 里拆出来，单独放在仓库根目录的 `seo/`：
 * - `seo/site.json`          站点级（品牌、作者、联系方式、站点 FAQ）
 * - `seo/posts/<id>.json`    文章级（描述、关键词、要点、FAQ、引用）
 *
 * 优先级：侧车 JSON > frontmatter > 正文首段派生。
 * 校验规则见 `scripts/seo/schema.ts`。
 */

export type SeoStatus = 'draft' | 'done'

export interface SeoFaqItem {
  question: string
  answer: string
}

/** 文章级 GEO 元数据（`seo/posts/<id>.json`） */
export interface PostSeo {
  /** OG / meta / JSON-LD 描述，目标 120–160 字符 */
  description: string
  /** 搜索关键词，喂给 JSON-LD `keywords` */
  keywords?: string[]
  /** 正文顶部「本文要点」列表（当前不渲染到页面，仅存档） */
  keyPoints?: string[]
  /** 问答对：目前只在 `seo/site.json` 的站点级 FAQ 里渲染到 /faq，文章级暂不展示 */
  faq?: SeoFaqItem[]
  /** JSON-LD `about`，描述文章主题实体 */
  about?: string[]
  /** JSON-LD `citation`，一手资料 URL */
  citations?: string[]
  /** 人工复核日期（YYYY-MM-DD） */
  reviewedAt?: string
  /** draft 不参与覆盖率强制校验 */
  status?: SeoStatus
}

/** 站点级 GEO 元数据（`seo/site.json`） */
export interface SiteSeo {
  /** 品牌主名，必须全站一致 */
  name: string
  /** SEO 标题（30–60 字符），首页与通用 title 使用 */
  title?: string
  /** 品牌别名，进 Organization.alternateName */
  alternateNames?: string[]
  url: string
  /** 站点描述，目标 120–160 字符 */
  description: string
  author: {
    name: string
    url?: string
    email?: string
    sameAs?: string[]
  }
  contact?: {
    email?: string
    url?: string
  }
  /** 站点主题，进 Organization.knowsAbout */
  topics?: string[]
  /** 站点级 FAQ，渲染到 /faq 并输出 FAQPage */
  faq?: SeoFaqItem[]
}

/** 解析后的文章元数据：侧车 / frontmatter / 推导三选一合成 */
export interface ResolvedPostSeo extends PostSeo {
  source: 'sidecar' | 'frontmatter' | 'derived'
}
