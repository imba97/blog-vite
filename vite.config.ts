import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import MarkdownItShiki from '@shikijs/markdown-it'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight
} from '@shikijs/transformers'
import { rendererRich, transformerTwoslash } from '@shikijs/twoslash'
import Vue from '@vitejs/plugin-vue'
import matter from 'gray-matter'
import anchor from 'markdown-it-anchor'
import MarkdownItExtraLink from 'markdown-it-extra-link'
import GitHubAlerts from 'markdown-it-github-alerts'
import LinkAttributes from 'markdown-it-link-attributes'
import TOC from 'markdown-it-table-of-contents'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import Markdown from 'unplugin-vue-markdown/vite'
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'
import Exclude from 'vite-plugin-optimize-exclude'
import { VueRouterAutoImports } from 'vue-router/unplugin'
import VueRouter from 'vue-router/vite'
import CopyButtonPlugin from './scripts/copy-button-plugin'
import { getGitMeta } from './scripts/get-git-meta'
import NetlifyImagePlugin from './scripts/netlify-image-plugin'
import { slugify } from './scripts/slugify'
import HtmlHeadInject from './scripts/vite/plugins/html-head-inject'
import PostsMeta from './scripts/vite/plugins/posts-meta'
import SearchIndex from './scripts/vite/plugins/search-index'
import { isSsgIncludedRoute } from './scripts/vite/ssg-included-routes'
import { postPublicPath } from './src/constants/route-policy'
import { isPublishablePostData, normalizeNumericPostId } from './src/content/post-policy'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const postsMarkdownRoot = path.normalize(r('posts'))
function isPostMarkdownFile(filePath: string): boolean {
  const abs = path.normalize(filePath)
  return abs === postsMarkdownRoot || abs.startsWith(`${postsMarkdownRoot}${path.sep}`)
}
const gitMeta = getGitMeta()
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(gitMeta.fullHash),
    __GIT_COMMIT_SHORT_HASH__: JSON.stringify(gitMeta.shortHash)
  },
  plugins: [
    HtmlHeadInject(),
    PostsMeta(),
    SearchIndex(),

    UnoCSS(),

    Vue({
      include: [/\.vue$/, /\.md$/]
    }),

    VueRouter({
      extensions: ['.vue', '.md'],
      routesFolder: [
        'pages',
        { src: r('posts'), path: 'posts/' }
      ],
      dts: r('.auto-generate/typed-router.d.ts'),
      extendRoute(route) {
        const defaultFile = route.components.get('default')
        if (!defaultFile)
          return

        if (defaultFile.endsWith('.md')) {
          const { data } = matter(readFileSync(defaultFile, 'utf-8'))

          route.addToMeta({
            frontmatter: data
          })

          if (isPostMarkdownFile(defaultFile) && isPublishablePostData(data)) {
            const id = normalizeNumericPostId(data)!
            const newPath = postPublicPath(id)
            route.path = newPath
            route.name = newPath
          }
        }
      }
    }),

    AutoImport({
      imports: [
        'vue',
        'pinia',
        '@vueuse/core',
        VueRouterAutoImports
      ],
      dts: r('.auto-generate/auto-imports.d.ts')
    }),

    Components({
      extensions: ['vue', 'md'],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
      dts: r('.auto-generate/components.d.ts')
    }),

    Markdown({
      headEnabled: true,
      exportFrontmatter: false,
      exposeFrontmatter: false,
      exposeExcerpt: false,
      markdownItOptions: {
        quotes: '""\'\''
      },
      async markdownItSetup(md) {
        // 先添加我们的复制按钮插件
        md.use(CopyButtonPlugin({
          codeCopyButtonTitle: '复制代码'
        }))
        if (isProduction)
          md.use(NetlifyImagePlugin())

        md.use(await MarkdownItShiki({
          themes: {
            dark: 'vitesse-dark',
            light: 'vitesse-light'
          },
          defaultColor: false,
          cssVariablePrefix: '--s-',
          transformers: [
            transformerTwoslash({
              explicitTrigger: true,
              renderer: rendererRich()
            }),
            transformerNotationDiff(),
            transformerNotationHighlight(),
            transformerNotationWordHighlight()
          ]
        }))

        md.use(MarkdownItExtraLink)

        md.use(anchor, {
          slugify,
          permalink: anchor.permalink.linkInsideHeader({
            symbol: '#',
            renderAttrs: () => ({ 'aria-hidden': 'true' })
          })
        })

        md.use(LinkAttributes, {
          matcher: (link: string) => /^https?:\/\//.test(link),
          attrs: {
            target: '_blank',
            rel: 'noopener'
          }
        })

        md.use(TOC, {
          includeLevel: [1, 2, 3, 4],
          slugify,
          containerHeaderHtml: '<div class="table-of-contents-anchor"><div class="i-ri-menu-2-fill" /></div>'
        })

        md.use(GitHubAlerts)
      },
      frontmatterPreprocess(frontmatter, options, _id, defaults) {
        const head = defaults(frontmatter, options)
        return { head, frontmatter }
      }
    }),

    Inspect(),
    Exclude()
  ],
  ...({
    ssgOptions: {
      formatting: 'minify',
      includedRoutes(paths: string[]) {
        return paths.filter(filePath => isSsgIncludedRoute(filePath))
      }
    }
  }),
  resolve: {
    alias: [
      { find: '~/', replacement: `${r('src')}/` }
    ]
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      '@vueuse/core',
      'dayjs',
      'dayjs/plugin/localizedFormat'
    ]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/src/composables/site-search-worker.ts')
            || id.includes('/src/components/SearchDialog.vue')
            || id.includes('/src/composables/use-site-search-query.ts')
            || id.includes('/src/workers/site-search.worker.ts')
            || id.includes('minisearch')
          ) {
            return 'search'
          }
          if (
            id.includes('/src/components/Twikoo.vue')
            || id.includes('/src/composables/useTwikooComments.ts')
            || id.includes('twikoo')
          ) {
            return 'comments'
          }
          if (id.includes('motion-v'))
            return 'motion'
          if (id.includes('floating-vue'))
            return 'ui'
          if (id.includes('/node_modules/'))
            return 'vendor'
          return undefined
        },
        // 自定义入口文件名格式
        entryFileNames: 'assets/entry-[hash].js',
        // 自定义代码块文件名格式
        chunkFileNames: 'assets/chunk-[hash].js',
        // 自定义资源文件名格式
        assetFileNames: 'assets/[hash][extname]'
      }
    }
  }
})
