/**
 * 与 `markdown-it-table-of-contents` 默认选项及用法对齐（见包内 `defaultOptions`）。
 * @see https://github.com/cmaas/markdown-it-table-of-contents
 */
declare module 'markdown-it-table-of-contents' {
  import type MarkdownIt from 'markdown-it'

  export interface MarkdownItTableOfContentsOptions {
    includeLevel?: number[]
    containerClass?: string
    slugify?: (text: string, rawToken: string) => string
    markerPattern?: RegExp
    omitTag?: string
    listType?: 'ul' | 'ol'
    format?: (content: string, md: MarkdownIt) => string
    containerHeaderHtml?: string
    containerFooterHtml?: string
    transformLink?: (href: string, text: string) => string
    transformContainerOpen?: (containerClass: string, containerHeaderHtml?: string) => string
    transformContainerClose?: (containerFooterHtml?: string) => string
    getTokensText?: (tokens: Array<{ type: string, content: string }>, rawToken: string) => string
  }

  function markdownItTableOfContents(
    md: MarkdownIt,
    options?: MarkdownItTableOfContentsOptions
  ): void

  export default markdownItTableOfContents
}
