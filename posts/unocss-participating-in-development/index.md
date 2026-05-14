---
id: 769
title: 参与一下 unocss 开发
date: 2023-08-29 20:26:09
tags:
  - unocss
categories:
  - 瞎研究
---

# Unocss

`unocss` 是个强大的原子化 CSS 引擎，可以让你无需考虑样式的命名，按需生成样式

比如

```html
<div mt-5></div>
```

就会自动生成样式

```css
[mt-5=""]{margin-top:1.25rem;}
```

# 发现需求

最近在做一个 `Hexo` 的主题，用到了 `unocss`

```typescript
import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify(), presetIcons()],
  cli: {
    entry: {
      patterns: ['layout/**/*.ejs'],
      outFile: 'source/css/style.css'
    }
  }
})
```

可以看到我配置了 `cli`，执行 `unocss` 它会获取 `layout` 下的所有 `.ejs` 文件

生成的样式输出到 `source/css/style.css`

但我如果想分成多个文件生成，比如根据 `layout` 下的文件夹、文件名等信息生成不同的样式文件

扒拉了一下生成文件的源码

```typescript
const outFile = resolve(options.cwd || process.cwd(), options.outFile ?? 'uno.css')
```

可以看到，`outFile` 只是拼接了程序执行目录和你设置的 `outFile`，如果没设置就默认生成 `uno.css`

所以我想着优化一下，让 `outFile` 可以支持例如 `source/css/[dirname]/[name].css` 的写法，或者直接是个函数

类似这样

```javascript
{
  outFile: info => `source/${info.dirname}/${info.name}.css`
}
```

# Uno 启动！

- 第一步，fork 项目、下载源码 [unocss](https://github.com/unocss/unocss)，参考其他人的 PR，fork 后还需要创建一个分支，格式是 `git 提交类型/简单的修改描述`

  例如我创建的分支叫 `feat/out-file`

- 下一步，安装，`pnpm install`，安装后执行 `pnpm dev`，因为是 `monorepo`，所以会在 `packages` 下的每个子项目中安装、执行 `dev`

  执行后每个子项目中会生成 `dist`，开发模式下会使用 `jiti` 来在执行时编译 `ts` 文件并执行

- 接下来，你只需要对 `src/*.ts` 进行修改即可

# 最后

头回知道 `jiti`，这种开发方式真的太爽了，不需要频繁执行 `tsc`，学到

我先去改了，争取 PR 成功合并

# 汇报

写完了发现 `unocss` 本身就支持多个输出文件功能，再加上几个单元测试没过，后面就不想搞了

最后在托尼老师的开源探店投了一稿：[开源探店直播 项目搜集](https://github.com/antfu/discussions/discussions/1#discussioncomment-7254789)
