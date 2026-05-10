---
id: 784
title: 写了个页面分享此时此刻我在听的歌
date: 2024-06-18 20:59:26
tags:
  - Navidrome
  - last.fm
categories:
  - 瞎研究
---

# 演示

因为是个网页，所以可以通过 `iframe` 分享到各处

<iframe src="https://imba97.me/playing" b-none w-full h="lt-md:160 md:180" rounded-8></iframe>

页面是 [https://imba97.me/playing](https://imba97.me/playing)

# 原理

最近发了篇博客文章：[《自建音乐服务 Navidrome》](https://imba97.cn/archives/782/)，里面提到可以使用 `last.fm` 来保存听歌历史

通过这个网站的接口可以拿到播放列表，根据听歌的先后顺序，也有当前是否正在播放的字段

![](/uploads/2024/06/playing-1.png)

## 后端

让 `Chat GPT` 用 `PHP` 写了个程序，功能就是简单的请求接口、10 秒数据缓存

因为 `last.fm` 接口给的图片国内没法访问，所以图片优先获取 `itunes` 上的，如果都没图，保底还会有个 `icon`

## 前端

用 <span icon i-devicon-vuejs></span> 简单写了个前端，10 秒轮询调接口获取最新数据

可以展示加载中、当前未听歌、当前正在听歌状态

用了 UnoCSS，永远的神！论 UnoCSS 实现一个旋转效果能有多简单

<div mb-6 flex items-center justify-center>
  <div rounded-full b="3 primary solid" text-primary>
    <div i-ph-music-note-simple-duotone h-20 w-20 animate-spin animate-duration-30000></div>
  </div>
</div>

```html
<div i-ph-music-note-simple-duotone h-20 w-20 animate-spin animate-duration-30000></div>
```

# 开源

<span icon i-mdi-github></span> Github: [imba97/playing-music](https://github.com/imba97/playing-music)
