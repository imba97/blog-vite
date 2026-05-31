---
id: 815
title: markdown-it 链接扩展插件
date: 2026-05-31 22:09:54
tags:
  - markdown-it
  - 插件
categories:
  - 个人项目
---

# 前因后果

上次我们探讨了本博客使用 Vite SSG 的构建方案，可以将 Markdown 转为 Vue 组件，其中底层就是基于 {link:github:markdown-it/markdown-it,markdown-it}，这是一个用于解析 Markdown 的库。同时它提供了编写插件的能力，可以方便地扩展 Markdown 的功能

于是我实现了一个一直以来想实现的功能

# 我的需求

在博客中会有一些跳转到博客其他文章的链接，常见写法一般是这样的固定写法

```markdown
[其他文章](/post/:id)
```

但如果文章标题或者 `/post` 路径部分发生了变化

比如之前的重构，从 `/archives` 改成了 `/post`，那么首先不可不免的需要将之前的链接设置永久重定向，其次还需要将文章中的链接进行修改。虽然可以不改，但是我还是想处理一下

如果是修改了标题，比如想更正格式、大小写之类的，那么所有使用的地方都需要修改。虽说有一键替换和 AI 处理，但每次这么改链接一点也不优雅

# 解决方案

于是我写了个 {link:github:imba97/markdown-it-extra-link,markdown-it-extra-link}，Markdown It 的链接扩展插件，目前实现了两个我常用的链接扩展

一个是引用一篇博客内的文章时，只需要写 `{link:post:814}` 即可，它会自动转换为“{link:post:814}”。未来即使标题变化，也不需要手动修改引用的地方

第二个是我常用的 GitHub 链接，我可以直接使用 `{link:github:imba97/blog-vite}`，它会自动转换为“{link:github:imba97/blog-vite}”

本质上这是个函数 `{link:类型:参数1,参数2,...}`，并预留了适配器，你可以很方便地扩展其他类型

```typescript
import { AbstractLink } from 'markdown-it-extra-link/abstract'

class BilibiliLinkType extends AbstractLink {
  readonly type = 'bili'

  protected handle(bvid = '') {
    bvid = bvid.trim()
    if (!bvid)
      return null
    return {
      href: `https://www.bilibili.com/video/${bvid}`,
      text: `Bilibili ${bvid}`
    }
  }
}

// 在配置中注册
md.use(MarkdownItExtraLink, {
  customTypes: [
    new BilibiliLinkType()
  ]
})
```

除此之外还有 RSS 支持以及 `post`、`github` 的配置，详情可见 {link:github:imba97/markdown-it-extra-link,markdown-it-extra-link}
