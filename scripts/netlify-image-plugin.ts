import type MarkdownIt from 'markdown-it'

const NETLIFY_IMAGE_PREFIX = '/.netlify/images?url='
const EXCLUDED_PROTOCOL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i

function shouldTransformSrc(src: string): boolean {
  const value = src.trim()

  if (!value)
    return false

  if (value.startsWith(NETLIFY_IMAGE_PREFIX))
    return false

  return !EXCLUDED_PROTOCOL_RE.test(value)
}

function toNetlifyImageUrl(src: string): string {
  return `${NETLIFY_IMAGE_PREFIX}${encodeURIComponent(src)}`
}

function transformSrc(src: string): string {
  if (!shouldTransformSrc(src))
    return src

  return toNetlifyImageUrl(src)
}

function toVueStringLiteral(value: string): string {
  return `'${value.replaceAll('\\', '\\\\').replaceAll('\'', '\\\'')}'`
}

function removeAttr(token: any, name: string): void {
  const index = token?.attrIndex?.(name) ?? -1
  if (index >= 0 && Array.isArray(token.attrs))
    token.attrs.splice(index, 1)
}

function transformImageToken(token: any): void {
  if (!token?.attrGet || !token?.attrSet)
    return

  const src = token.attrGet('src')
  if (typeof src !== 'string')
    return

  const transformed = transformSrc(src)
  if (transformed !== src) {
    removeAttr(token, 'src')
    token.attrSet(':src', toVueStringLiteral(transformed))
  }
}

function transformHtmlImgSrc(content: string): string {
  return content.replace(/<img\b[^>]*>/gi, (imgTag) => {
    if (/\b(?::src|v-bind:src)\s*=/.test(imgTag))
      return imgTag

    return imgTag.replace(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i, (fullMatch, _raw, dqValue, sqValue, unquotedValue) => {
      const currentSrc = (dqValue ?? sqValue ?? unquotedValue ?? '').trim()
      const transformed = transformSrc(currentSrc)

      if (transformed === currentSrc)
        return fullMatch

      return `:src="${toVueStringLiteral(transformed)}"`
    })
  })
}

export default function netlifyImagePlugin() {
  return (md: MarkdownIt) => {
    md.core.ruler.after('inline', 'netlify-image-transform', (state) => {
      for (const token of state.tokens) {
        if (token.type === 'html_block' || token.type === 'html_inline')
          token.content = transformHtmlImgSrc(token.content)

        if (token.type === 'image')
          transformImageToken(token)

        if (token.type === 'inline' && Array.isArray(token.children)) {
          for (const child of token.children) {
            if (child.type === 'image')
              transformImageToken(child)

            if (child.type === 'html_inline' || child.type === 'html_block')
              child.content = transformHtmlImgSrc(child.content)
          }
        }
      }
    })
  }
}
