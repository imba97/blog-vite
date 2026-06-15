import type { FeedOptions, Item } from 'feed'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { Feed } from 'feed'
import MarkdownIt from 'markdown-it'
import MarkdownItExtraLinkRss from 'markdown-it-extra-link/rss'
import { parsePostDateToTimestamp } from '../src/content/post-date'
import { parsePostFiles } from './parse-post-files'

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
markdown.use(MarkdownItExtraLinkRss, {
  baseUrl: DOMAIN
})

async function buildBlogRSS() {
  const posts = await parsePostFiles()

  const options: FeedOptions = {
    title: 'imba97',
    description: 'imba97 Blog',
    id: 'https://imba97.com/',
    link: 'https://imba97.com/',
    copyright: 'CC BY-NC-SA 4.0 2018 © imba97',
    feedLinks: {
      rss: 'https://imba97.com/feed.xml'
    }
  }

  const items: Item[] = []
  for (const { file, path, data, content, date } of posts) {
    const parsedTimestamp = parsePostDateToTimestamp(date)
    if (Number.isNaN(parsedTimestamp)) {
      console.warn(`[rss] Skip post with invalid date: ${file} (${date || 'empty'})`)
      continue
    }

    const link = DOMAIN + path
    const html = markdown.render(content).replace('src="/', `src="${DOMAIN}/`)
    const image = typeof data.image === 'string' && data.image.startsWith('/')
      ? DOMAIN + data.image
      : data.image

    items.push({
      ...data,
      id: link,
      link,
      image,
      date: new Date(parsedTimestamp),
      content: html,
      author: [AUTHOR]
    } as Item)
  }

  await writeFeed('feed', options, items)
}

async function writeFeed(name: string, options: FeedOptions, items: Item[]) {
  options.author = AUTHOR
  options.image = 'https://imba97.com/favicon.png'
  options.favicon = 'https://imba97.com/favicon.png'

  const feed = new Feed(options)
  for (const item of items)
    feed.addItem(item)

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

buildBlogRSS()
