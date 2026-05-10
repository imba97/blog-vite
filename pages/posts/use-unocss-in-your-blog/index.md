---
id: 775
title: 在博客中使用 UnoCSS！
date: 2024-01-01 01:04:39
tags:
  - UnoCSS
categories:
  - Hexo
---

# 演示

```html
<div text="center 10 primary">你可以设置字体样式</div>
```

<div py-5>
  <div text="center 10 primary">你可以设置字体样式</div>
</div>

---

```html
<div text-10 animate-bounce>轻松设置动画</div>
```

<div py-5>
  <div text-10 animate-bounce>轻松设置动画</div>
</div>

---

```html
<div flex items-center justify-center gap-3>
  <div>设置一个图标</div>
  <div i-mdi-emoticon-cool-outline h-10 w-10></div>

  <div flex="~ col" items-center>
    <div i-mdi-emoticon-angry-outline animate="wobble count-infinite" h-15 w-15 bg-red></div>
    <div>加点颜色？再设置个动画？</div>
  </div>

  <div i-line-md-moon-twotone-loop h-10 w-10 bg-primary></div>
  <div>使用动画图标</div>
</div>
```

<div my-5 flex items-center justify-center gap-3>
  <div>设置一个图标</div>
  <div i-mdi-emoticon-cool-outline h-10 w-10></div>

  <div flex="~ col" items-center>
    <div i-mdi-emoticon-angry-outline animate-wobble animate-count-infinite h-15 w-15 bg-red></div>
    <div>加点颜色？再设置个动画？</div>
  </div>

  <div i-line-md-moon-twotone-loop h-10 w-10 bg-primary></div>
  <div>使用动画图标</div>
</div>

---

```html
<div py-5 rounded-xl flex items-center justify-center bg-gradient-to-b from-blue to-primary>
  <div text="10 white" tracking>来个渐变色</div>
</div>
```

<div my-5>
  <div py-5 rounded-xl flex items-center justify-center bg-gradient-to-b from-blue to-primary>
    <div text="10 white" tracking>来个渐变色</div>
  </div>
</div>

---

<div my-5>
  <div text="5 center">实现一个图片九宫格</div>
</div>

```html
<div mx-a mt-5 p-1 w-90 bg-white b="3 solid primary">
  <div grid="~ cols-3" gap-1 class="[&>img]:(m-0! w-30 h-30 object-cover)">
    <img src="/uploads/2023/04/code-server-1.png">
    <img src="/uploads/2023/12/report-2023-3.png">
    <img src="/uploads/2023/12/report-2023-4.png">
    <img src="/uploads/2023/07/serialport-1-1.jpg">
    <img src="/uploads/2023/07/serialport-1-2.jpg">
    <img src="/uploads/2023/07/serialport-1-3.jpg">
    <img src="/uploads/2023/03/bitwarden-login-error-1.png">
    <img src="/uploads/2022/10/simple-zip-upload-1.png">
    <img src="/uploads/2018/08/switch_4.gif">
  </div>
</div>
```

<div my-5>
  <div mx-a p-1 w-90 bg-white b="3 solid primary">
    <div grid="~ cols-3" gap-1 class="[&>img]:(m-0! w-30 h-30 object-cover)">
      <img src="/uploads/2023/04/code-server-1.png">
      <img src="/uploads/2023/12/report-2023-3.png">
      <img src="/uploads/2023/12/report-2023-4.png">
      <img src="/uploads/2023/07/serialport-1-1.jpg">
      <img src="/uploads/2023/07/serialport-1-2.jpg">
      <img src="/uploads/2023/07/serialport-1-3.jpg">
      <img src="/uploads/2023/03/bitwarden-login-error-1.png">
      <img src="/uploads/2022/10/simple-zip-upload-1.png">
      <img src="/uploads/2018/08/switch_4.gif">
    </div>
  </div>
</div>

---

<div text="5">做个好看的 Todo List</div>

```html
<div text="10 primary" font-bold>我的计划</div>

<div my-5>
  <div flex items-center gap-1>
    <div i-ic-round-check-box h-8 w-8 bg-green></div>
    <div text="5 gray-3" decoration="line-through">hexo-unocss</div>
  </div>
  <div flex items-center gap-1>
    <div i-ic-round-check-box-outline-blank h-8 w-8></div>
    <div text="5">浏览器标签墙</div>
  </div>
  <div flex items-center gap-1>
    <div i-ic-round-check-box-outline-blank h-8 w-8></div>
    <div text="5">数字游民</div>
  </div>
</div>
```

<div text="10 primary" font-bold>我的计划</div>

<div my-5>
  <div flex items-center gap-1>
    <div i-ic-round-check-box h-8 w-8 bg-green></div>
    <div text="5 gray-3" decoration="line-through">hexo-unocss</div>
  </div>
  <div flex items-center gap-1>
    <div i-ic-round-check-box-outline-blank h-8 w-8></div>
    <div text="5">浏览器标签墙</div>
  </div>
  <div flex items-center gap-1>
    <div i-ic-round-check-box-outline-blank h-8 w-8></div>
    <div text="5">数字游民</div>
  </div>
</div>

# 使用

安装插件和相关依赖（必选）

```bash
npm install hexo-unocss unocss
```

## 使用图标

安装 icon（可选）

```bash
npm install @iconify/json
```

图标站：[Icônes](https://icones.js.org/)

# 配置

## 插件配置

```yml
unocss:
  # 是否启用
  enable: true

  # 生成的样式文件
  # 以 source 为根目录
  file: css/uno.css

  # 扫描文件
  patterns:
    - 'source/**/*.md'
```

## UnoCSS 配置

配置完全沿用 UnoCSS 的配置，详情请参考 [https://unocss.dev/config/](https://unocss.dev/config/)

在根目录下新建 `uno.config.ts`，推荐以下配置。包含基础写法、属性写法、icon 的预设配置

```typescript
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  content: {
    pipeline: {
      include: [/\.(md)($|\?)/]
    }
  },
  theme: {
    colors: {
      primary: '#50528a'
    }
  }
})
```

自定义颜色 `primary` 后，即可使用 `text-primary`、`bg-primary` 等

推荐 VSCode 插件

- [antfu.unocss](https://marketplace.visualstudio.com/items?itemName=antfu.unocss) 可以显示具体生成的样式和颜色
- [antfu.iconify](https://marketplace.visualstudio.com/items?itemName=antfu.iconify) 可以直接显示图标

不愧是托尼老师！

![](/uploads/2024/01/hexo-unocss-1.png)
