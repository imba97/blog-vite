import antfu from '@antfu/eslint-config'

export default antfu({
  unocss: true,

  // 生成物（`pnpm run generate-langs` 维护），不参与 lint
  ignores: ['src/generated/**'],

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
