import type MarkdownIt from 'markdown-it'

export interface CopyButtonPluginOptions {
  codeCopyButtonTitle?: string
}

export default function copyButtonPlugin(options: CopyButtonPluginOptions = {}) {
  return (md: MarkdownIt) => {
    const { codeCopyButtonTitle = '复制代码' } = options

    // 检查 renderer 是否存在
    if (!md.renderer) {
      console.warn('MarkdownIt renderer not found')
      return
    }

    const fence = md.renderer.rules.fence!

    md.renderer.rules.fence = (...args: any[]) => {
      const [tokens, idx] = args
      const token = tokens[idx]

      // 提取语言
      const lang = extractLang(token.info)

      // 渲染原始代码块
      const rawCode = fence(...args)

      // 添加复制按钮的 HTML 结构
      return [
        `<div class="language-${lang}">`,
        `<button class="copy" title="${codeCopyButtonTitle}" type="button">`,
        `<span class="ready"></span>`,
        `<span class="success"></span>`,
        `</button>`,
        rawCode,
        '</div>'
      ].join('')
    }
  }
}

function extractLang(info: string): string {
  return info.trim().split(' ')[0] || 'text'
}
