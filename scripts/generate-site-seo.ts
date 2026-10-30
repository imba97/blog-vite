/**
 * 把 `seo/site.json` 编译成浏览器可直接 import 的模块：
 *
 * - `.auto-generate/site-seo.ts`  站点基础信息（名称 / 标题 / URL / 作者 / 主题）
 * - `.auto-generate/site-faq.ts`  站点 FAQ（只被 /faq 页引用，不进首屏）
 *
 * 侧车 JSON 是唯一事实来源，避免常量散落在 share-meta / json-ld 里各写一份。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import process from 'node:process'
import { loadPagesSeo, loadSiteSeo } from './seo/load-seo.ts'

const SITE_SEO_FILE = '.auto-generate/site-seo.ts'
const SITE_FAQ_FILE = '.auto-generate/site-faq.ts'
const SITE_PAGES_FILE = '.auto-generate/site-pages.ts'

const HEADER = '/* eslint-disable */'

export async function generateSiteSeo(
  seoFile = SITE_SEO_FILE,
  faqFile = SITE_FAQ_FILE,
  pagesFile = SITE_PAGES_FILE
): Promise<void> {
  const site = loadSiteSeo()

  const siteSeo = {
    name: site.name,
    title: site.title,
    alternateNames: site.alternateNames ?? [],
    url: site.url,
    description: site.description,
    author: {
      name: site.author.name,
      url: site.author.url,
      email: site.author.email,
      sameAs: site.author.sameAs ?? []
    },
    contact: site.contact ?? {},
    topics: site.topics ?? []
  }

  const seoSource = `${HEADER}
// 由 scripts/generate-site-seo.ts 从 seo/site.json 生成，请勿手改
import type { SiteSeo } from '../src/types/seo'

export const siteSeo: SiteSeo = ${JSON.stringify(siteSeo, null, 2)}

export default siteSeo
`

  const faqSource = `${HEADER}
// 由 scripts/generate-site-seo.ts 从 seo/site.json 生成，请勿手改
import type { SeoFaqItem } from '../src/types/seo'

export const siteFaq: SeoFaqItem[] = ${JSON.stringify(site.faq ?? [], null, 2)}

export default siteFaq
`

  const pagesSource = `${HEADER}
// 由 scripts/generate-site-seo.ts 从 seo/pages.json 生成，请勿手改
import type { PageSeoEntry } from '../scripts/seo/load-seo'

export const sitePages: Record<string, PageSeoEntry> = ${JSON.stringify(Object.fromEntries(loadPagesSeo()), null, 2)}

export default sitePages
`

  await mkdir(dirname(seoFile), { recursive: true })
  await writeFile(seoFile, seoSource, 'utf-8')
  await writeFile(faqFile, faqSource, 'utf-8')
  await writeFile(pagesFile, pagesSource, 'utf-8')
}

// CLI 入口（pnpm run generate-site-seo）
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  await generateSiteSeo()
  console.log('[site-seo] 写入 .auto-generate/site-seo.ts、site-faq.ts、site-pages.ts')
}
