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
import { dedupeStylesheetsInHtml } from './scripts/vite/dedupe-stylesheets'
import FontPreload from './scripts/vite/plugins/font-preload'
import HtmlHeadInject from './scripts/vite/plugins/html-head-inject'
import PostsMeta from './scripts/vite/plugins/posts-meta'
import SearchIndex from './scripts/vite/plugins/search-index'
import { applyMarkdownRouteMeta } from './scripts/vite/route-frontmatter'
import { isSsgIncludedRoute } from './scripts/vite/ssg-included-routes'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))
const postsMarkdownRoot = path.normalize(r('posts'))

const gitMeta = getGitMeta()
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  define: {
    __GIT_COMMIT_HASH__: JSON.stringify(gitMeta.fullHash),
    __GIT_COMMIT_SHORT_HASH__: JSON.stringify(gitMeta.shortHash)
  },
  plugins: [
    HtmlHeadInject(),
    FontPreload(),
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
        applyMarkdownRouteMeta(route as Parameters<typeof applyMarkdownRouteMeta>[0], postsMarkdownRoot)
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
      async markdownSetup(md: { use: (plugin: any, ...params: any[]) => any }) {
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
      },
      onPageRendered(route, html) {
        // vite-ssg 在 SSR 阶段会再注入一份 `<link rel="stylesheet">`，
        // 与 Vite 产物中的同名 link 重复下载，去重只保留首条；
        // 同时在非文章页丢弃 `assets/article.css`，该样式仅在文章页需要
        return dedupeStylesheetsInHtml(html, route)
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
        manualChunks(id: string) {
          // 文章详情页专属样式：与 reset 分到独立 chunk，避免拖累首页 LCP
          if (
            id.includes('@shikijs/twoslash')
            || id.includes('shiki-magic-move')
            || id.includes('markdown-it-github-alerts')
            || id.includes('/src/assets/styles/prose.css')
            || id.includes('/src/assets/styles/markdown.css')
            || id.includes('/src/assets/styles/copy-button')
            || id.includes('/src/assets/styles/article.ts')
          ) {
            return 'article'
          }
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
          // 不再把所有 node_modules 统一塞进 vendor，避免单 chunk 过大
          // 让 Vite 按依赖关系自动拆分（通常按包名分组，体积更均匀）
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
