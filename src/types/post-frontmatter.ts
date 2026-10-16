/**
 * 文章 frontmatter 宽松形状：路由与构建期从 @11ty/gray-matter 读入，字段可能缺失或非预期类型。
 * 是否「可发布」由 `~/content/post-policy` 判定。
 *
 * 字段约定：
 * - `id`        数字 id，必填
 * - `title`     标题，必填
 * - `date`      发布时间，必填
 * - `updated`   最后更新时间（用于 JSON-LD dateModified 与 sitemap lastmod）
 * - `draft`     true 则不发布
 * - `tags`      string[] 或逗号分隔 string
 * - `categories` string[] 或逗号分隔 string
 * - `image`     封面图 URL（绝对/相对均可，相对会被规范化为 https://imba97.com/...）
 * - `description` SEO/GEO 摘要（OG description / JSON-LD description / RSS 兜底）
 * - `keywords`  string[]（喂给 JSON-LD keywords 字段）
 */
export interface PostFrontmatter {
  id?: string | number
  title?: string
  date?: string | Date
  updated?: string | Date
  draft?: boolean
  tags?: string[] | string
  categories?: string[] | string
  image?: string
  description?: string
  keywords?: string[] | string
  [key: string]: unknown
}
