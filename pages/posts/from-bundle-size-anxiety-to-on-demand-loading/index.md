---
id: 813
title: 从体积焦虑到按需加载
date: 2026-05-10 09:12:52
tags:
  - 字体优化
  - 字体子集
categories:
  - 个人项目
---

## 从体积焦虑到按需加载

写了个中文字体子集化工具 `charbi-font`

---

## 开发契机

受公司大佬做的工具的启发，了解到字体子集化这条路径。说来惭愧，入行前端这么多年了，还是头一次知道

字体子集化确实能显著减小体积，但落地到工作中的项目时，发现还有一些绕不开的需求

---

## 发现需求

1. 多字重支持

   阿里巴巴普惠体在项目里用到 5 种字重，希望能自动合并管理，不想手动维护多份配置

2. 文本内容变化

   新项目迭代快，要考虑文案、字重可能会有变更，以及后续随着迭代的文案变更等，我太懒，不想每次都手动维护字符清单

3. 上传分发能力

   Base64 自带 33% 体积增加，受小程序包体限制影响，感觉早晚需要放到云存储，所以需要有上传、构造版本路径等能力

---

## charbi-font 做了什么

`charbi-font` 覆盖了从扫描、构建到分发的完整链路：

- 递归扫描源码，提取真实使用字符
- 扫描时自动过滤注释内容
- 原字体本地缓存，避免反复下载造成的浪费
- 上传 CDN（如 COS），支持并发上传和远端存在判断
- 支持 `extraText` 手动补充动态文本
- 输出 `woff / woff2 / ttf`
- 自动生成 CSS/SCSS 样式文件
- 支持多字重合并管理

### 实测压缩效果

| 名称 | 原体积（MB） | 压缩体积（KB） | 压缩率 |
| --- | ---: | ---: | ---: |
| Alibaba PuHuiTi (5 weights) | 35 MB | 985 KB | 97.22% |
| DingTalkJinBuTi | 2 MB | 214 KB | 89.71% |
| DelaGothicOne | 2 MB | 144 KB | 94.08% |
| Total | 39 MB | 1,343 KB | 96.63% |

### 其他特性

- #### Vite 插件支持

  通过 Vite 插件，实现业务侧更多能力

  <details>
    <summary>
      配置 Vite 插件...查看更多
    </summary>

  ```ts
  import CharbiFont from 'charbi-font/vite'

  export default defineConfig(() => {
    plugins: [
      CharbiFont()
    ]
  })
  ```

  使用 TS 可以在 `tsconfig.json` 中添加类型支持

  ```json
  {
    "compilerOptions": {
      "types": ["charbi-font/client"]
    }
  }
  ```
  </details>

- #### 获取加载字体所需字段

  因为需要基于版本号创建不同的目录，防止多版本相互影响。在生成的样式中是自动写入的，但有时也会使用 `uni.loadFontFace` 在 JS 中加载字体

  <details>

  业务侧无需再手写一份字重与文件名对照表

  ```ts
  import { BUILD_FONT_FACES, FONT_ASSET_BASE_URL, FONT_BUILD_VERSION } from 'virtual:charbi-font'

  for (const face of BUILD_FONT_FACES) {
    const base = FONT_ASSET_BASE_URL
    if (!base)
      continue
    uni.loadFontFace({
      global: true,
      family: face.family,
      source: `url("${base}/${face.file}")`,
      desc: {
        style: face.style,
        weight: face.weight,
        variant: face.variant
      }
    })
  }
  ```

    <summary>
      业务侧无需再手写一份...查看更多
    </summary>
  </details>

## 使用

### 安装

```
pnpm add charbi-font -D
```

### 配置

目录下创建 `fonts.config.ts`，配置示例

```ts
import { defineConfig } from 'charbi-font/config'

/**
 * 字体构建配置
 */
export default defineConfig({
  build: {
    // 可选：字体版本基线（不填则默认读取 package.json 的 version）
    // 扫描配置 - 自动从项目中提取使用的字符
    scan: {
      srcDir: ['src'],
      extensions: ['vue', 'ts', 'tsx', 'js', 'jsx', 'scss', 'css']
    },

    // 字体配置 - 从 COS 下载原始字体
    fonts: [
      // 阿里巴巴普惠体 Regular - 按钮文字
      {
        family: 'Alibaba PuHuiTi',
        name: 'Regular',
        weight: 400,
        url: 'https://example.com/AlibabaPuHuiTi-3-55-Regular.ttf'
      },
      // 阿里巴巴普惠体 Medium - 中等粗细
      {
        family: 'Alibaba PuHuiTi',
        name: 'Medium',
        weight: 500,
        url: 'https://example.com/AlibabaPuHuiTi-3-65-Medium.ttf'
      },
      // 阿里巴巴普惠体 SemiBold - 半粗体
      {
        family: 'Alibaba PuHuiTi',
        name: 'SemiBold',
        weight: 600,
        url: 'https://example.com/AlibabaPuHuiTi-3-75-SemiBold.ttf'
      },
      // 阿里巴巴普惠体 Bold - 粗体标题
      {
        family: 'Alibaba PuHuiTi',
        name: 'Bold',
        weight: 700,
        url: 'https://example.com/AlibabaPuHuiTi-3-85-Bold.ttf'
      },
      // 阿里巴巴普惠体 Black - 标题强调
      {
        family: 'Alibaba PuHuiTi',
        name: 'Black',
        weight: 900,
        url: 'https://example.com/AlibabaPuHuiTi-3-115-Black.ttf',
        extraText: [
          '歪比巴卜'
        ]
      },
      // 钉钉进步体 - 标题/艺术字
      {
        family: 'DingTalkJinBuTi',
        name: 'Regular',
        weight: 400,
        url: 'https://example.com/DingTalk-JinBuTi.ttf'
      },
      // Dela Gothic One - 价格数字
      {
        family: 'DelaGothicOne',
        name: 'Regular',
        weight: 400,
        url: 'https://example.com/DelaGothicOne-Regular.ttf',
        format: 'ttf' // 单独配置为 ttf 格式
      }
    ],

    // 输出配置
    output: {
      // CSS 输出目录（fonts.scss/css 汇总文件生成在此目录）
      cssDir: 'src/styles',
      format: 'woff2',
      // 样式文件格式: scss 或 css
      styleFormat: 'scss',
      fontDisplay: 'optional'
    }
  },

  upload: {
    provider: 'cos',
    concurrency: 5
  },

  // COS 上传配置
  cos: {
    // Bucket 名称
    bucket: 'bucket-name',
    // 所属地域
    region: 'ap-guangzhou',
    // 上传路径（包含完整路径，{version} 会被替换为实际版本号）
    basePath: '/cos/static/fonts/built/{version}',
    // CDN 基础地址（只包含域名）
    cdnUrl: 'https://cos.example.com'
  }
})
```

### 命令

```bash
# 构建及上传
pnpm charbi

# 仅构建
pnpm chabi build

# 仅上传
pnpm chabi upload
```

## 关于名称

最开始让 AI 起名，我说可以造组合字，于是在一堆名称中我一眼看到了 `char + build = charbi`（你没有偷摸骂我吧？）

## 开源

[Github](https://github.com/imba97/charbi-font)
