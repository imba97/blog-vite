import MarkdownIt from 'markdown-it'

const markdown = MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

function normalizeImageCandidate(input: unknown): string | null {
  if (typeof input !== 'string')
    return null
  const value = input.trim()
  if (!value)
    return null
  return value
}

function extractFirstMarkdownImage(content: string): string | null {
  const tokens = markdown.parse(content, {})
  for (const token of tokens) {
    if (token.type !== 'inline' || !token.children)
      continue
    for (const child of token.children) {
      if (child.type !== 'image')
        continue
      const src = normalizeImageCandidate(child.attrGet('src'))
      if (src)
        return src
    }
  }
  return null
}

function parseSrcFromImgTag(imgTag: string): string | null {
  const start = imgTag.toLowerCase().indexOf('<img')
  if (start < 0)
    return null

  const end = imgTag.indexOf('>', start)
  if (end < 0)
    return null

  const attributes = imgTag.slice(start + 4, end)
  let index = 0

  while (index < attributes.length) {
    while (index < attributes.length && /\s/.test(attributes[index]))
      index += 1

    if (index >= attributes.length)
      break

    const nameStart = index
    while (index < attributes.length && !/[\s=]/.test(attributes[index]))
      index += 1

    const rawName = attributes.slice(nameStart, index)
    while (index < attributes.length && /\s/.test(attributes[index]))
      index += 1

    if (attributes[index] !== '=') {
      while (index < attributes.length && !/\s/.test(attributes[index]))
        index += 1
      continue
    }

    index += 1
    while (index < attributes.length && /\s/.test(attributes[index]))
      index += 1

    if (index >= attributes.length)
      break

    let value = ''
    const quote = attributes[index]
    if (quote === '"' || quote === '\'') {
      index += 1
      const valueStart = index
      while (index < attributes.length && attributes[index] !== quote)
        index += 1
      value = attributes.slice(valueStart, index)
      if (index < attributes.length)
        index += 1
    }
    else {
      const valueStart = index
      while (index < attributes.length && !/\s/.test(attributes[index]) && attributes[index] !== '>')
        index += 1
      value = attributes.slice(valueStart, index)
    }

    if (rawName.toLowerCase() === 'src')
      return normalizeImageCandidate(value)
  }

  return null
}

function extractFirstHtmlImage(content: string): string | null {
  const tokens = markdown.parse(content, {})
  for (const token of tokens) {
    if (token.type !== 'html_inline' && token.type !== 'html_block')
      continue
    const src = parseSrcFromImgTag(token.content)
    if (src)
      return src
  }
  return null
}

export function extractPostImage(frontmatter: Record<string, unknown>, content: string): string | null {
  const frontmatterImage = normalizeImageCandidate(frontmatter.image)
  if (frontmatterImage)
    return frontmatterImage

  const markdownImage = extractFirstMarkdownImage(content)
  if (markdownImage)
    return markdownImage

  return extractFirstHtmlImage(content)
}
