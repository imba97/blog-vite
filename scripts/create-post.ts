import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
import matter from 'gray-matter'
import { glob } from 'tinyglobby'

const POSTS_CONTENT_GLOB = 'posts/**/index.md'
const POSTS_ROOT_INDEX_FILE = 'posts/index.md'
const MAX_SLUG_LENGTH = 50

interface CliOptions {
  title: string
  slug: string
}

function parseCliArgs(argv: string[]): CliOptions {
  const options = new Map<string, string>()

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (!arg.startsWith('--'))
      continue

    const eqIndex = arg.indexOf('=')
    if (eqIndex > 0) {
      const key = arg.slice(0, eqIndex)
      const value = arg.slice(eqIndex + 1)
      options.set(key, value)
      continue
    }

    const key = arg
    const value = argv[i + 1]
    if (value && !value.startsWith('--')) {
      options.set(key, value)
      i++
      continue
    }

    options.set(key, '')
  }

  const title = (options.get('--title') ?? '').trim()
  const slug = (options.get('--slug') ?? '').trim()

  if (!title)
    throw new Error('Missing required argument: --title')
  if (!slug)
    throw new Error('Missing required argument: --slug')

  return { title, slug }
}

function validateSlug(slug: string): void {
  if (slug.length > MAX_SLUG_LENGTH) {
    throw new Error(`Slug is too long: ${slug.length}. Maximum allowed length is ${MAX_SLUG_LENGTH}.`)
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Invalid slug format. Only lowercase letters, numbers, and "-" are allowed.')
  }
}

function formatDateTime(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

function toSingleQuotedYamlString(value: string): string {
  return `'${value.replace(/'/g, '\'\'')}'`
}

async function getNextPostId(): Promise<number> {
  const files = await glob(POSTS_CONTENT_GLOB)
  let maxId = 0

  for (const file of files) {
    if (file === POSTS_ROOT_INDEX_FILE)
      continue

    const raw = await readFile(file, 'utf-8')
    const { data } = matter(raw)
    const idStr = String((data as Record<string, unknown>).id ?? '').trim()
    if (!/^\d+$/.test(idStr))
      continue

    const id = Number(idStr)
    if (id > maxId)
      maxId = id
  }

  return maxId + 1
}

async function ensureTargetNotExists(postFilePath: string): Promise<void> {
  try {
    await access(postFilePath)
    throw new Error(`Target already exists: ${postFilePath}`)
  }
  catch (error) {
    const errno = error as NodeJS.ErrnoException
    if (errno.code === 'ENOENT')
      return
    throw error
  }
}

async function main(): Promise<void> {
  const { title, slug } = parseCliArgs(process.argv.slice(2))
  validateSlug(slug)

  const postDir = `posts/${slug}`
  const postFile = `${postDir}/index.md`
  await ensureTargetNotExists(postFile)

  const id = await getNextPostId()
  const date = formatDateTime(new Date())

  const frontmatter = `---
id: ${id}
title: ${toSingleQuotedYamlString(title)}
date: ${date}
tags:
  -
categories:
  -
---
`

  await mkdir(postDir, { recursive: true })
  await writeFile(postFile, frontmatter, 'utf-8')

  console.log(`Created ${postFile}`)
  console.log(`id=${id}`)
  console.log(`date=${date}`)
}

await main()
