---
id: 793
title: initx 更方便的脚本引擎
date: 2024-10-25 16:33:01
tags:
  - initx
categories:
  - 个人项目
---

## 简要

最近发布的 <span icon i-material-symbols-release-alert-rounded bg-amber></span> [v0.0.12](https://github.com/initx-collective/initx/releases/tag/v0.0.12) 版本中移除了默认业务功能，转而加入了 <span icon i-mingcute-plugin-2-fill bg-primary></span> 插件系统

用了一周开发到目前的状态，我觉得 `initx` 的功能好的**超出**了我的预期（自嗨）

我其实很早之前就一直在写一些零散的脚本，把一些复杂的东西简单化，一般是放在仓库，有新环境用到的话要拉代码、配置、执行，感觉还挺麻烦

不管有没有重复造轮子，我非常喜欢 `initx` 以及享受开发过程 🤣

## 插件系统

把业务功能的选择交给使用者，将插件的包安装到全局即可，类似

```bash
npm i @initx-plugin/git -g
```

非常骄傲的宣布，从现在开始 `initx` 是一个**更方便的脚本引擎**，它会负责

- 提供方便的入口
- 收集插件
- 收集匹配器命中的执行器
- 处理可能的用户交互
- 执行！🚀

而你，可以专注于写脚本

## 提供方便的入口

```bash
npx initx <something>
```

作为免安装脚本，你可以直接使用 `npx` 执行，虽然它也会被安装在某个角落

## 收集插件

`initx` 会先从全局安装目录加载所有依赖，根据包名过滤出插件，动态引入插件代码

## 收集匹配器命中的执行器

**匹配器**和**执行器**是 `initx` 的两大核心，可以使用字符串和正则表达式，也可以通过数组组合它们

命中后匹配器的介绍和执行器会被收集起来

## 处理可能的用户交互

如果多个执行器被命中，则会清晰的展示插件名和匹配器介绍，让用户选择执行哪一个

## 而你

可以专注于写脚本！

## starter

插件开发在此起步 <span icon i-logos-github-icon></span> [initx-plugin-starter](https://github.com/initx-collective/initx-plugin-starter)

```ts
import type { InitxCtx } from '@initx-plugin/core'
import { InitxHandler } from '@initx-plugin/core'
import { log } from '@initx-plugin/utils'

export default class StarterHandler extends InitxHandler {
  matchers = [
    {
      matching: 'start',
      description: 'Plugin starter'
    }
  ]

  async handle(ctx: InitxCtx, ...others: string[]) {
    log.info('initx-plugin-starter is running 🎊')

    log.info('ctx')
    console.log(ctx)

    log.info('others')
    console.log(others)
  }
}
```

拉取项目后安装依赖

```bash
pnpm i
```

得益于 `unbuild` 使用的 `jiti`，可以直接使用 `stub` 模式开发，无需每次打包

```bash
pnpm stub
```

最后把本地包全局安装

```bash
npm i . -g
```

现在只需要专注插件开发，以及测试你的脚本，比如

```bash
npx initx start user --name imba97
```

得益于 <span icon i-logos-github-icon></span> [cac](https://github.com/cacjs/cac)，这个库帮我们处理好了指令，会输出

```text
[ INFO ] initx-plugin-starter is running 🎊
[ INFO ] ctx
{
  key: 'start',
  cliOptions: { '--': [], name: 'imba97' },
  optionsList: []
}
[ INFO ] others
[ 'user' ]
```

祝你用餐愉快 🍴
