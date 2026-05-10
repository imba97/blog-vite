import {
  createLocalFontProcessor
} from '@unocss/preset-web-fonts/local'
import { unoColors } from 'uno-colors'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup
} from 'unocss'

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
  theme: {
    colors: unoColors({
      primary: '#50528a'
    }),
    breakpoints
  },
  shortcuts: [
    {
      'site-shell': 'bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors duration-200',
      'site-container': 'mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8',
      'page-container': 'site-container pt-6 pb-10 sm:pt-8 sm:pb-14',
      'page-container-readable': 'site-container max-w-[75ch] pt-8 pb-12 sm:pt-10 sm:pb-16',
      'surface-base': 'bg-white dark:bg-neutral-900',
      'surface-subtle': 'bg-gray-100/70 dark:bg-neutral-800/60',
      'border-subtle': 'border-gray-200/85 dark:border-neutral-800',
      'text-muted': 'text-gray-600 dark:text-gray-400',
      'focus-ring-primary': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-5/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950',
      'interactive-soft': 'transition-colors duration-200 hover:bg-gray-100/75 dark:hover:bg-neutral-800/80',
      'bg-base': 'bg-white dark:bg-black',
      'color-base': 'text-black dark:text-white',
      'border-base': 'border-[#8884]',
      'list-divider': 'border-gray-200/80 dark:border-neutral-800',
      'list-link-hover': 'interactive-soft',
      'list-title': 'text-gray-800 dark:text-gray-100',
      'list-title-hover': 'hover:text-primary-6 dark:hover:text-primary-4',
      'list-meta': 'text-muted',
      'pagination-text': 'text-gray-600 dark:text-gray-400 hover:text-primary-6 dark:hover:text-primary-4',
      'pagination-current': 'text-primary-6 dark:text-primary-4',
      'pagination-ellipsis': 'text-gray-400 dark:text-gray-500',
      'prose-shell': 'text-gray-700 dark:text-gray-300',
      'card-soft': 'surface-base border border-subtle rounded-xl shadow-sm'
    },

    // 常用卡片样式
    {
      'card': 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm',
      'card-hover': 'card transition-all hover:border-primary-3 hover:shadow-md',
      'btn-primary': 'bg-primary-5 text-white px-4 py-2 rounded-lg hover:bg-primary-6 transition-colors font-medium',
      'btn-secondary': 'bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium',
      'input-base': 'border border-gray-300 rounded-lg px-3 py-2 focus:border-primary-5 focus:ring-2 focus:ring-primary-2 outline-none transition-all'
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
      extraProperties: {
        'display': 'inline-block',
        'height': '1.2em',
        'width': '1.2em',
        'vertical-align': 'text-bottom'
      }
    }),
    presetAttributify(),
    presetWind3(),
    presetTypography(),
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
  ],
  content: {
    pipeline: {
      include: [

      ],
      exclude: [
        'node_modules/**/*',
        'dist/**/*'
      ]
    }
  }
})
