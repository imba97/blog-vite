/**
 * 文章 frontmatter 宽松形状：路由与构建期从 gray-matter 读入，字段可能缺失或非预期类型。
 * 是否「可发布」由 `~/content/post-policy` 判定。
 */
export interface PostFrontmatter {
  id?: string | number
  title?: string
  date?: string | Date
  draft?: boolean
  tags?: string[] | string
  categories?: string[] | string
  image?: string
  [key: string]: unknown
}
