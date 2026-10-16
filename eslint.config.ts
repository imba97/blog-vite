import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,

  // 生成物 / 大体积静态资源：不参与 lint，避免 antfu formatter 跑大文件拖慢全量扫描
  ignores: [
    'src/generated/**',
    'public/uploads/**',
    'public/llms.txt',
    'public/llms-full.txt',
    'public/sitemap.xml',
    'public/search-*.json'
  ],

  rules: {
    'style/comma-dangle': ['warn', 'never']
  },

  vue: {
    overrides: {
      'vue/block-order': ['error', {
        order: ['style', 'template', 'script']
      }],
      'vue/comma-dangle': ['warn', 'never']
    }
  },

  jsonc: {
    overrides: {
      'jsonc/comma-dangle': ['warn', 'never']
    }
  },

  // 先关闭 markdown 的检查
  markdown: false
})
