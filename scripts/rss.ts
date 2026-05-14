import type { FeedOptions, Item } from 'feed'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Feed } from 'feed'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { glob } from 'tinyglobby'
import { postPublicPath } from '../src/constants/route-policy'
import { isPublishablePostData, normalizeNumericPostId } from '../src/content/post-policy'
import { POSTS_CONTENT_GLOB, POSTS_ROOT_INDEX_FILE } from './post-content-paths'

const DOMAIN = 'https://imba97.com'
const FOLLOW_CHALLENGE_FEED_ID = '41798923170845756'
const FOLLOW_CHALLENGE_USER_ID = '56237599479518208'
const FOLLOW_CHALLENGE_XML = [
  '<follow_challenge>',
  `  <feedId>${FOLLOW_CHALLENGE_FEED_ID}</feedId>`,
  `  <userId>${FOLLOW_CHALLENGE_USER_ID}</userId>`,
  '</follow_challenge>'
].join('\n')
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
  const files = await glob(POSTS_CONTENT_GLOB)

  const options = {
    title: 'imba97',
    description: 'imba97 Blog',
    id: 'https://imba97.com/',
    link: 'https://imba97.com/',
    copyright: 'CC BY-NC-SA 4.0 2018 © imba97',
    feedLinks: {
      rss: 'https://imba97.com/feed.xml'
    }
  }
  const posts = (await Promise.all(
    files.filter(i => i !== POSTS_ROOT_INDEX_FILE)
      .map(async (i) => {
        const raw = await readFile(i, 'utf-8')
        const { data, content } = matter(raw)

        if (!isPublishablePostData(data))
          return null

        const idStr = normalizeNumericPostId(data as Record<string, unknown>)!
        const link = DOMAIN + postPublicPath(idStr)

        const html = markdown.render(content)
          .replace('src="/', `src="${DOMAIN}/`)

        const image = typeof data.image === 'string' && data.image.startsWith('/')
          ? DOMAIN + data.image
          : data.image

        return {
          ...data,
          id: link,
          link,
          image,
          date: new Date(data.date as string | Date),
          content: html,
          author: [AUTHOR]
        } as Item
      })
  )).filter((x): x is Item => x != null)

  posts.sort((a, b) => +new Date(b.date as Date) - +new Date(a.date as Date))

  await writeFeed('feed', options, posts)
}

async function writeFeed(name: string, options: FeedOptions, items: Item[]) {
  options.author = AUTHOR
  options.image = 'https://imba97.com/favicon.png'
  options.favicon = 'https://imba97.com/favicon.png'

  const feed = new Feed(options)

  items.forEach(item => feed.addItem(item))

  await mkdir(dirname(`./dist/${name}`), { recursive: true })
  const rssXml = injectFollowChallengeToRssRoot(feed.rss2())
  await writeFile(`./dist/${name}.xml`, rssXml, 'utf-8')
  await rm(`./dist/${name}.atom`, { force: true })
  await rm(`./dist/${name}.json`, { force: true })
}

function injectFollowChallengeToRssRoot(xml: string) {
  if (!xml.includes('<channel>'))
    return xml

  return xml.replace('<channel>', `${FOLLOW_CHALLENGE_XML}\n<channel>`)
}

run()
