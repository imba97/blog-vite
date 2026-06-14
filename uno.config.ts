import {
  createLocalFontProcessor
} from '@unocss/preset-web-fonts/local'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'
import { colors } from './scripts/unocss/colors'
import { navbar } from './src/configs/nav'

const navIconSafelist = navbar.flatMap(({ icon }) => icon.split(/\s+/))

const breakpoints = {
  'xs': '320px',
  'sm': '480px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
  '3xl': '1920px'
}

export default defineConfig({
  safelist: navIconSafelist,
  theme: {
    colors,
    breakpoints
  },
  shortcuts: [
    {
      'site-shell': 'bg-gray-100/70 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors duration-200',
      'site-container': 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8',
      'page-container': 'site-container pt-6 pb-10 sm:pt-8 sm:pb-14',
      'page-container-readable': 'site-container max-w-[48rem] pt-12 pb-14 sm:pt-14 sm:pb-18',
      'surface-base': 'bg-white dark:bg-neutral-900',
      'surface-subtle': 'bg-gray-100/75 dark:bg-neutral-800/65',
      'border-subtle': 'border-gray-200/85 dark:border-neutral-700/80',
      'text-soft': 'text-gray-500 dark:text-gray-500',
      'focus-ring-primary': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-5/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-primary-light/65 dark:focus-visible:ring-offset-neutral-950',
      'interactive-soft': 'transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-neutral-800/72',
      'nav-link': 'fyc gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors duration-200 sm:gap-2 sm:px-2.5 interactive-soft hover:text-primary-6 dark:text-gray-200 dark:hover:text-primary-light',
      'chrome-icon-btn': 'fyc rounded-lg p-2 text-gray-700 transition-colors duration-200 interactive-soft hover:text-primary-6 dark:text-gray-200 dark:hover:text-primary-light focus-ring-primary',
      'bg-base': 'bg-white dark:bg-black',
      'color-base': 'text-gray-900 dark:text-gray-100',
      'border-base': 'border-gray-300/60 dark:border-neutral-700/80',
      'list-divider': 'border-gray-200/80 dark:border-neutral-800',
      'list-link-hover': 'interactive-soft hover:bg-gray-50/85 dark:hover:bg-neutral-800/80',
      'list-title': 'text-gray-800 dark:text-gray-100',
      'list-title-hover': 'hover:text-primary-6 dark:hover:text-primary-light',
      'list-meta': 'text-muted',
      'pagination-nav': 'text-gray-600 dark:text-gray-300 hover:text-primary-6 dark:hover:text-primary-light',
      'pagination-page': 'border border-transparent bg-transparent text-gray-700 dark:text-gray-300',
      'pagination-page-hover': 'hover:bg-primary-light/22 hover:text-primary-6 dark:hover:bg-primary-light/18 dark:hover:text-primary-light',
      'pagination-current': 'border !border-transparent !bg-primary-6 !text-white dark:!bg-primary-light dark:!text-neutral-950',
      'pagination-disabled': 'cursor-not-allowed border-transparent bg-transparent text-gray-400 dark:text-gray-600 hover:bg-transparent dark:hover:bg-transparent hover:text-gray-400 dark:hover:text-gray-600',
      'pagination-ellipsis': 'text-gray-400 dark:text-gray-500',
      'prose-shell': 'text-gray-700 dark:text-gray-300',
      'card-soft': 'surface-base border border-subtle rounded-xl',
      'search-hit-link': 'block min-w-0 rounded-lg px-2 py-2.5 transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.04]',
      'search-hit-title': 'text-gray-600/90 font-normal transition-colors duration-200 group-hover:text-gray-700 dark:text-gray-400/95 dark:group-hover:text-gray-300'
    },

    // 常用卡片样式
    {
      'card': 'rounded-xl border border-subtle surface-base p-4',
      'card-hover': 'card transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-neutral-800/65 dark:hover:border-primary-light/30',
      'btn-primary': 'rounded-lg bg-primary-6 px-4 py-2 text-white font-medium transition-colors duration-200 hover:bg-primary-7 focus-ring-primary',
      'btn-secondary': 'rounded-lg bg-gray-100 px-4 py-2 text-gray-700 font-medium transition-colors duration-200 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-200 dark:hover:bg-neutral-700 focus-ring-primary',
      'input-base': 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition-[border-color,box-shadow] duration-200 focus:border-primary-5 focus:ring-2 focus:ring-primary-2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-100 dark:focus:border-primary-light'
    },

    [/^clickable(-.*)?$/, ([, scale]) => `cursor-pointer transition active:scale${scale || '-95'}`],

    ['pr', 'relative'],
    ['pa', 'absolute'],
    ['pf', 'fixed'],
    ['ps', 'sticky'],

    // position layout
    ['pxc', 'pa left-1/2 -translate-x-1/2'],
    ['pyc', 'pa top-1/2 -translate-y-1/2'],
    ['pcc', 'pxc pyc'],

    // flex layout
    ['fcc', 'flex justify-center items-center'],
    ['fccc', 'fcc flex-col'],
    ['fxc', 'flex justify-center'],
    ['fyc', 'flex items-center'],
    ['fs', 'flex justify-start'],
    ['fsc', 'flex justify-start items-center'],
    ['fse', 'flex justify-start items-end'],
    ['fe', 'flex justify-end'],
    ['fec', 'flex justify-end items-center'],
    ['fb', 'flex justify-between'],
    ['fbc', 'flex justify-between items-center'],
    ['fa', 'flex justify-around'],
    ['fac', 'flex justify-around items-center'],
    ['fw', 'flex justify-wrap'],
    ['fwr', 'flex justify-wrap-reverse']
  ],
  rules: [
  ],
  presets: [
    presetIcons({
      cdn: 'https://esm.sh/',
      scale: 1.2,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'text-bottom'
      }
    }),
    presetAttributify(),
    presetWind3(),
    presetWebFonts({
      fonts: {
        sans: 'Inter',
        mono: 'DM Mono'
      },
      processors: createLocalFontProcessor()
    })
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup()
  ]
})
