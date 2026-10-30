/**
 * 构建期生成 `public/summary.json`：机器可读的站点清单。
 *
 * GEO 检测里的 AI Discovery 项要求站点提供一个聚合入口（summary.json），
 * 让模型一次拿到「站点是谁、写什么、有哪些入口、最近更新了什么」，
 * 不用爬全站。内容和 llms.txt 同源，但字段是结构化的。
 *
 * 写入 public/，由 Vite 在构建时拷贝到 dist/。
 */
import { Buffer } from 'node:buffer'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { postPublicPath, PROSE_CONTENT_PAGE_PATHS } from '../src/constants/route-policy.ts'
import { parsePostFiles } from './parse-post-files.ts'
import { loadSiteSeo, resolvePostSeo } from './seo/load-seo.ts'

const SITE_URL = 'https://imba97.com'
const MAX_RECENT_POSTS = 20

const STATIC_PAGE_META: Record<string, string> = {
  '/': '首页：最新文章列表与站点入口',
  '/about': '关于站长：技术背景、正在折腾的项目与联系方式',
  '/links': '友情链接：一起折腾前端、开源与自建服务的朋友',
  '/archives': '文章归档：按时间浏览全部文章',
  '/faq': '常见问题：关于内容、技术栈、转载与联系方式的问答'
}

export interface SummaryStats {
  posts: number
  bytes: number
}

export async function generateSummaryJson(outDir = 'public'): Promise<SummaryStats> {
  const site = loadSiteSeo()
  const posts = await parsePostFiles()

  const recentPosts = posts.slice(0, MAX_RECENT_POSTS).map((post) => {
    const resolved = resolvePostSeo({ id: post.idStr, frontmatter: post.data, content: post.content })
    return {
      id: post.idStr,
      title: String(post.data.title ?? '').trim(),
      url: `${SITE_URL}${postPublicPath(post.idStr)}`,
      date: post.date,
      description: resolved.description
    }
  })

  const pages = [
    ...Object.entries(STATIC_PAGE_META).map(([path, description]) => ({
      url: `${SITE_URL}${path === '/' ? '/' : path}`,
      description
    })),
    ...PROSE_CONTENT_PAGE_PATHS.filter(path => !(path in STATIC_PAGE_META)).map(path => ({
      url: `${SITE_URL}${path}`,
      description: `${path} 页面`
    }))
  ]

  const payload = {
    name: site.name,
    title: site.title,
    alternateNames: site.alternateNames ?? [],
    url: site.url,
    description: site.description,
    language: 'zh-CN',
    author: {
      name: site.author.name,
      url: site.author.url,
      email: site.author.email,
      sameAs: site.author.sameAs ?? []
    },
    contact: {
      email: site.contact?.email ?? site.author.email,
      url: site.contact?.url ?? site.author.url
    },
    topics: site.topics ?? [],
    stats: {
      posts: posts.length,
      latestPostDate: posts[0]?.date ?? '',
      generatedAt: new Date().toISOString()
    },
    pages,
    feeds: {
      rss: `${SITE_URL}/feed.xml`,
      llms: `${SITE_URL}/llms.txt`,
      llmsFull: `${SITE_URL}/llms-full.txt`,
      sitemap: `${SITE_URL}/sitemap.xml`,
      summary: `${SITE_URL}/summary.json`
    },
    faq: site.faq ?? [],
    recentPosts
  }

  const json = `${JSON.stringify(payload, null, 2)}\n`
  await mkdir(outDir, { recursive: true })
  await writeFile(join(outDir, 'summary.json'), json, 'utf-8')

  return {
    posts: posts.length,
    bytes: Buffer.byteLength(json, 'utf-8')
  }
}

// CLI 入口（pnpm run generate-summary）
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const stats = await generateSummaryJson()
  console.log(`[summary] 写入 public/summary.json ${String.fromCharCode(183)} ${stats.posts} 篇文章 ${String.fromCharCode(183)} ${(stats.bytes / 1024).toFixed(1)} KiB`)
}
