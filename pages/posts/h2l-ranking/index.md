---
id: 811
title: 写了个从夯到拉排行榜组件
date: 2026-02-08 10:28:35
tags:
  - 从夯到拉
  - 组件
  - Vue3
categories:
  - 个人项目
---

# 前言

起因是本人经常喝完瑞幸新品后跟朋友们简评一波，然后列个榜单。所以不如就直接搞个从夯到拉的网页，既然要做不如就直接封装成组件，于是就有了这个

顺便一说，瑞幸家五黑拿铁、西瓜拿铁、每日维C果蔬茶我是给到一个夯的

# h2l-ranking

![](/uploads/2026/02/h2l-ranking-1.png)

体验页面：[https://imba97.me/ranking](https://imba97.me/ranking)

## 安装

```bash
pnpm add h2l-ranking
```

## 使用

```html
<template>
  <H2lRanking :rankings="rankings" />
</template>

<script setup lang="ts">
import H2lRanking from 'h2l-ranking'
import { ref } from 'vue'
import 'h2l-ranking/style.css'

const rankings = ref({
  hang: [
    {
      title: '《中二病也要谈恋爱》',
      cover: '/images/1.png',
      url: 'https://example.com/1',
      description: '本人入宅作，给到一个夯'
    },
    { title: '《玉子爱情故事》', cover: '/images/2.png' },
    { title: '《葬送的芙莉莲》', cover: '/images/3.png' },
    { title: '《我心里危险的东西》', description: '心理描写细腻，适合我们死宅体质', cover: '/images/4.png' },
    { title: '《双城之战》', cover: '/images/5.png', description: '金克斯牛逼！' }
  ],
  upper: [
    { title: '《搞笑漫画日和》', cover: '/images/6.png' },
    { title: '《胆大党》', cover: '/images/7.png' },
    { title: '《荒川爆笑团》', cover: '/images/8.png' },
    { title: '《银魂》', cover: '/images/9.png' },
    { title: '《某科学的超电磁炮》', cover: '/images/10.png' },
    { title: '《魔法禁书目录》', cover: '/images/11.png' },
    { title: '《热带雨林的爆笑生活》', cover: '/images/12.png' }
  ],
  middle: [],
  lower: [],
  la: []
})
</script>
```

# 开源

<span i-mdi-github></span> [imba97/h2l-ranking](https://github.com/imba97/h2l-ranking)
