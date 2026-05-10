import type { FeedOptions, Item } from 'feed'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Feed } from 'feed'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { glob } from 'tinyglobby'

const DOMAIN = 'https://imba97.com'
const AUTHOR = {
  name: 'imba97',
  email: 'mail@imba97.cn',
  link: DOMAIN
}
const markdown = MarkdownIt({
  html: true,
  breaks: true,
  linkify: true
})

async function run() {
  await buildBlogRSS()
}

async function buildBlogRSS() {
  const files = await glob('pages/posts/*.md')

  const options = {
    title: 'imba97',
    description: 'imba97 Blog',
    id: 'https://imba97.com/',
    link: 'https://imba97.com/',
    copyright: 'CC BY-NC-SA 4.0 2018 © imba97',
    feedLinks: {
      json: 'https://imba97.com/feed.json',
      atom: 'https://imba97.com/feed.atom',
      rss: 'https://imba97.com/feed.xml'
    }
  }
  const posts: any[] = (
    await Promise.all(
      files.filter(i => !i.includes('index'))
        .map(async (i) => {
          const raw = await readFile(i, 'utf-8')
          const { data, content } = matter(raw)

          const html = markdown.render(content)
            .replace('src="/', `src="${DOMAIN}/`)

          if (data.image?.startsWith('/'))
            data.image = DOMAIN + data.image

          const link = DOMAIN + i.replace(/pages\/posts\/.+/, `/posts/${data.id}`)

          return {
            ...data,
            id: link,
            link,
            date: new Date(data.date),
            content: html,
            author: [AUTHOR]
          }
        })
    ))
    .filter(Boolean)

  posts.sort((a, b) => +new Date(b.date) - +new Date(a.date))

  await writeFeed('feed', options, posts)
}

async function writeFeed(name: string, options: FeedOptions, items: Item[]) {
  options.author = AUTHOR
  options.image = 'https://imba97.com/favicon.png'
  options.favicon = 'https://imba97.com/favicon.png'

  const feed = new Feed(options)

  items.forEach(item => feed.addItem(item))

  await mkdir(dirname(`./dist/${name}`), { recursive: true })
  await writeFile(`./dist/${name}.xml`, feed.rss2(), 'utf-8')
  await writeFile(`./dist/${name}.atom`, feed.atom1(), 'utf-8')
  await writeFile(`./dist/${name}.json`, feed.json1(), 'utf-8')
}

run()
