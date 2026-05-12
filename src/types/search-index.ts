export interface SearchMetaRecord {
  id: string
  path: string
  title: string
  date: string
  tags: string[]
  categories: string[]
}

export interface SearchFullRecord extends SearchMetaRecord {
  text: string
}

export interface SearchHit {
  path: string
  title: string
  date: string
  /** 正文匹配摘要（有关键词检索时）；纯范围浏览时通常为空 */
  snippet: string
  tags: string[]
  categories: string[]
}
