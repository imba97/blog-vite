import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

interface MarkdownItLike {
  core: {
    ruler: {
      after: (afterName: string, ruleName: string, handler: (state: any) => void) => void
    }
  }
}

const NETLIFY_IMAGE_PREFIX = '/.netlify/images?url='
const EXCLUDED_PROTOCOL_RE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i
const IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|avif)(?:$|\?)/i
const ANIMATED_OR_VECTOR_EXT_RE = /\.(?:gif|svg)(?:$|\?)/i
const DEFAULT_QUALITY = 75
const PROJECT_ROOT = process.cwd()

interface ImageDimensions {
  width: number
  height: number
}

interface TransformContext {
  markdownFilePath?: string
  seenFirstImage: boolean
}

function shouldTransformSrc(src: string): boolean {
  const value = src.trim()

  if (!value)
    return false

  if (value.startsWith(NETLIFY_IMAGE_PREFIX))
    return false

  return !EXCLUDED_PROTOCOL_RE.test(value)
}

function toNetlifyImageUrl(src: string): string {
  const params = new URLSearchParams({
    url: src
  })

  const qualityRaw = Number.parseInt(process.env.VITE_NETLIFY_IMAGE_QUALITY ?? '', 10)
  const quality = Number.isFinite(qualityRaw) && qualityRaw > 0 ? qualityRaw : DEFAULT_QUALITY
  params.set('q', String(quality))

  const widthRaw = Number.parseInt(process.env.VITE_NETLIFY_IMAGE_WIDTH ?? '', 10)
  if (Number.isFinite(widthRaw) && widthRaw > 0)
    params.set('w', String(widthRaw))

  if (IMAGE_EXT_RE.test(src) && !ANIMATED_OR_VECTOR_EXT_RE.test(src)) {
    const format = (process.env.VITE_NETLIFY_IMAGE_FORMAT || 'webp').trim()
    if (format)
      params.set('fm', format)
  }

  return `/.netlify/images?${params.toString()}`
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

function normalizeImagePath(rawSrc: string): string {
  return rawSrc.trim().split('#')[0].split('?')[0]
}

function decodePathIfNeeded(value: string): string {
  try {
    return decodeURIComponent(value)
  }
  catch {
    return value
  }
}

function resolveMarkdownFilePath(env: Record<string, unknown> | null | undefined): string | undefined {
  if (!env)
    return undefined

  const possibleKeys = ['id', 'path', 'file', 'filename', 'resourcePath'] as const
  for (const key of possibleKeys) {
    const raw = env[key]
    if (typeof raw !== 'string')
      continue

    const normalized = decodePathIfNeeded(raw).split('?')[0]
    if (normalized.endsWith('.md') && existsSync(normalized))
      return normalized
  }

  return undefined
}

function resolveLocalImagePath(src: string, markdownFilePath?: string): string | null {
  const normalized = decodePathIfNeeded(normalizeImagePath(src))
  if (!normalized || EXCLUDED_PROTOCOL_RE.test(normalized))
    return null

  if (normalized.startsWith('/')) {
    const fromRoot = path.resolve(PROJECT_ROOT, normalized.slice(1))
    return existsSync(fromRoot) ? fromRoot : null
  }

  if (markdownFilePath) {
    const fromMarkdown = path.resolve(path.dirname(markdownFilePath), normalized)
    if (existsSync(fromMarkdown))
      return fromMarkdown
  }

  const fromRoot = path.resolve(PROJECT_ROOT, normalized)
  return existsSync(fromRoot) ? fromRoot : null
}

function parsePngDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 24)
    return null
  const signature = buffer.subarray(0, 8)
  const expected = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0xD, 0xA, 0x1A, 0xA])
  if (!signature.equals(expected))
    return null
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  }
}

function parseGifDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 10)
    return null
  const header = buffer.toString('ascii', 0, 6)
  if (header !== 'GIF87a' && header !== 'GIF89a')
    return null
  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8)
  }
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xFF || buffer[1] !== 0xD8)
    return null

  let offset = 2
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xFF) {
      offset += 1
      continue
    }

    const marker = buffer[offset + 1]
    if (
      marker === 0xD8
      || marker === 0xD9
      || marker === 0x01
      || (marker >= 0xD0 && marker <= 0xD7)
    ) {
      offset += 2
      continue
    }

    if (offset + 4 >= buffer.length)
      return null
    const segmentLength = buffer.readUInt16BE(offset + 2)
    if (segmentLength < 2)
      return null

    const isStartOfFrame
      = marker === 0xC0
        || marker === 0xC1
        || marker === 0xC2
        || marker === 0xC3
        || marker === 0xC5
        || marker === 0xC6
        || marker === 0xC7
        || marker === 0xC9
        || marker === 0xCA
        || marker === 0xCB
        || marker === 0xCD
        || marker === 0xCE
        || marker === 0xCF

    if (isStartOfFrame) {
      if (offset + 8 >= buffer.length)
        return null
      return {
        width: buffer.readUInt16BE(offset + 7),
        height: buffer.readUInt16BE(offset + 5)
      }
    }

    offset += 2 + segmentLength
  }

  return null
}

function parseWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 30)
    return null
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP')
    return null

  const chunkType = buffer.toString('ascii', 12, 16)
  if (chunkType === 'VP8X') {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3)
    }
  }

  if (chunkType === 'VP8 ' && buffer.length >= 30) {
    return {
      width: buffer.readUInt16LE(26) & 0x3FFF,
      height: buffer.readUInt16LE(28) & 0x3FFF
    }
  }

  if (chunkType === 'VP8L' && buffer.length >= 25 && buffer[20] === 0x2F) {
    const b0 = buffer[21]
    const b1 = buffer[22]
    const b2 = buffer[23]
    const b3 = buffer[24]
    return {
      width: 1 + (((b1 & 0x3F) << 8) | b0),
      height: 1 + (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6))
    }
  }

  return null
}

function parseSvgDimensions(buffer: Buffer): ImageDimensions | null {
  const content = buffer.toString('utf-8')
  const svgTagMatch = content.match(/<svg\b[^>]*>/i)
  if (!svgTagMatch)
    return null
  const svgTag = svgTagMatch[0]

  const widthMatch = svgTag.match(/\bwidth\s*=\s*["']?([\d.]+)(?:px)?["']?/i)
  const heightMatch = svgTag.match(/\bheight\s*=\s*["']?([\d.]+)(?:px)?["']?/i)
  if (widthMatch && heightMatch) {
    const width = Number.parseFloat(widthMatch[1])
    const height = Number.parseFloat(heightMatch[1])
    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0)
      return { width: Math.round(width), height: Math.round(height) }
  }

  const viewBoxMatch = svgTag.match(/\bviewBox\s*=\s*["']([\d.\s-]+)["']/i)
  if (!viewBoxMatch)
    return null
  const parts = viewBoxMatch[1].trim().split(/\s+/)
  if (parts.length !== 4)
    return null
  const width = Number.parseFloat(parts[2])
  const height = Number.parseFloat(parts[3])
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
    return null
  return { width: Math.round(width), height: Math.round(height) }
}

function getImageDimensions(absPath: string): ImageDimensions | null {
  let buffer: Buffer
  try {
    buffer = readFileSync(absPath)
  }
  catch {
    return null
  }

  const ext = path.extname(absPath).toLowerCase()
  if (ext === '.png')
    return parsePngDimensions(buffer)
  if (ext === '.jpg' || ext === '.jpeg')
    return parseJpegDimensions(buffer)
  if (ext === '.webp')
    return parseWebpDimensions(buffer)
  if (ext === '.gif')
    return parseGifDimensions(buffer)
  if (ext === '.svg')
    return parseSvgDimensions(buffer)
  return null
}

function applyImageLoadingAttrs(token: any, isFirstImage: boolean): void {
  token.attrSet('loading', isFirstImage ? 'eager' : 'lazy')
  token.attrSet('decoding', 'async')
  if (isFirstImage)
    token.attrSet('fetchpriority', 'high')
}

function injectDimensionsForToken(token: any, src: string, ctx: TransformContext): void {
  if (token.attrGet('width') && token.attrGet('height'))
    return

  const absPath = resolveLocalImagePath(src, ctx.markdownFilePath)
  if (!absPath)
    return
  const dimensions = getImageDimensions(absPath)
  if (!dimensions)
    return

  token.attrSet('width', String(dimensions.width))
  token.attrSet('height', String(dimensions.height))
}

function setOrReplaceAttr(tag: string, name: string, value: string): string {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const attrRe = new RegExp(`\\b${escapedName}\\s*=\\s*(".*?"|'.*?'|[^\\s"'=<>\\\`]+)`, 'i')
  if (attrRe.test(tag))
    return tag.replace(attrRe, `${name}="${value}"`)
  return tag.replace(/<img\b/i, `<img ${name}="${value}"`)
}

function readAttr(tag: string, name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const attrRe = new RegExp(`\\b${escapedName}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>\\\`]+))`, 'i')
  const match = tag.match(attrRe)
  if (!match)
    return null
  return (match[2] ?? match[3] ?? match[4] ?? '').trim()
}

function normalizeLegacyZoomStyle(imgTag: string): string {
  const style = readAttr(imgTag, 'style')
  if (!style)
    return imgTag

  const zoomMatch = style.match(/\bzoom\s*:\s*([\d.]+)\s*%?\s*;?/i)
  if (!zoomMatch)
    return imgTag

  const rawValue = Number.parseFloat(zoomMatch[1])
  if (!Number.isFinite(rawValue) || rawValue <= 0)
    return imgTag

  const widthPercent = zoomMatch[0].includes('%') ? rawValue : rawValue * 100
  const clampedPercent = Math.min(100, Math.max(1, widthPercent))
  const normalizedPercent = Number.parseFloat(clampedPercent.toFixed(2))

  const styleWithoutZoom = style
    .replace(/\bzoom\s*:\s*[\d.]+\s*%?\s*;?/gi, '')
    .replace(/\s*;\s*;/g, ';')
    .trim()

  let nextStyle = styleWithoutZoom
  if (!/\bwidth\s*:/i.test(nextStyle))
    nextStyle = `${nextStyle}${nextStyle && !nextStyle.endsWith(';') ? '; ' : ''}width: ${normalizedPercent}%;`
  if (!/\bheight\s*:/i.test(nextStyle))
    nextStyle = `${nextStyle}${nextStyle && !nextStyle.endsWith(';') ? '; ' : ''}height: auto;`

  return setOrReplaceAttr(imgTag, 'style', nextStyle.trim())
}

function injectDimensionsForImgTag(imgTag: string, src: string, ctx: TransformContext): string {
  if (/\bwidth\s*=/.test(imgTag) && /\bheight\s*=/.test(imgTag))
    return imgTag

  const absPath = resolveLocalImagePath(src, ctx.markdownFilePath)
  if (!absPath)
    return imgTag
  const dimensions = getImageDimensions(absPath)
  if (!dimensions)
    return imgTag

  let nextTag = imgTag
  nextTag = setOrReplaceAttr(nextTag, 'width', String(dimensions.width))
  nextTag = setOrReplaceAttr(nextTag, 'height', String(dimensions.height))
  return nextTag
}

function transformImageToken(token: any, ctx: TransformContext): void {
  if (!token?.attrGet || !token?.attrSet)
    return

  const src = token.attrGet('src')
  if (typeof src !== 'string')
    return

  const isFirstImage = !ctx.seenFirstImage
  if (!ctx.seenFirstImage)
    ctx.seenFirstImage = true

  applyImageLoadingAttrs(token, isFirstImage)
  injectDimensionsForToken(token, src, ctx)

  const transformed = transformSrc(src)
  if (transformed !== src) {
    removeAttr(token, 'src')
    token.attrSet(':src', toVueStringLiteral(transformed))
  }
}

function transformHtmlImgSrc(content: string, ctx: TransformContext): string {
  return content.replace(/<img\b[^>]*>/gi, (imgTag) => {
    const rawSrc = readAttr(imgTag, 'src')
    const hasBoundSrc = /\b(?::src|v-bind:src)\s*=/.test(imgTag)
    const isFirstImage = !ctx.seenFirstImage
    if (!ctx.seenFirstImage)
      ctx.seenFirstImage = true

    let transformedTag = imgTag
    if (hasBoundSrc || !rawSrc) {
      transformedTag = imgTag
    }
    else {
      transformedTag = normalizeLegacyZoomStyle(transformedTag)
      transformedTag = injectDimensionsForImgTag(transformedTag, rawSrc, ctx)
      const transformed = transformSrc(rawSrc)
      if (transformed !== rawSrc)
        transformedTag = transformedTag.replace(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i, `:src="${toVueStringLiteral(transformed)}"`)
    }

    transformedTag = setOrReplaceAttr(transformedTag, 'loading', isFirstImage ? 'eager' : 'lazy')
    transformedTag = setOrReplaceAttr(transformedTag, 'decoding', 'async')
    if (isFirstImage)
      transformedTag = setOrReplaceAttr(transformedTag, 'fetchpriority', 'high')

    return transformedTag
  })
}

export default function netlifyImagePlugin() {
  return (md: MarkdownItLike) => {
    md.core.ruler.after('inline', 'netlify-image-transform', (state) => {
      const ctx: TransformContext = {
        markdownFilePath: resolveMarkdownFilePath(state.env as Record<string, unknown> | null | undefined),
        seenFirstImage: false
      }

      for (const token of state.tokens) {
        if (token.type === 'html_block' || token.type === 'html_inline')
          token.content = transformHtmlImgSrc(token.content, ctx)

        if (token.type === 'image')
          transformImageToken(token, ctx)

        if (token.type === 'inline' && Array.isArray(token.children)) {
          for (const child of token.children) {
            if (child.type === 'image')
              transformImageToken(child, ctx)

            if (child.type === 'html_inline' || child.type === 'html_block')
              child.content = transformHtmlImgSrc(child.content, ctx)
          }
        }
      }
    })
  }
}
