---
id: 791
title: Cloudflare Axios 请求问题
date: 2024-10-01 11:03:20
tags:
  - Nuxt
  - Cloudflare
  - Axios
categories:
  - 瞎研究
---

# 事情经过

之前 Nuxt 项目中使用了 `axios` 在 Server 端发送请求，包括获取数据和图片两种

但部署到 Cloudflare 后，发现会报错

```text
the 'credentials' field on 'requestinitializerdict' is not implemented.
```

应该是 Cloudflare Workers 不支持 `credentials` 这个字段，但 `axios` 默认会有

# 尝试解决

## Axios Adapter

使用 `@haverstack/axios-fetch-adapter` 可以解决请求问题，这个库会换成 `fetch` 请求

但换成这个库后，图片会拿不到，所以暂时放弃了

# 解决方法

抛弃 `axios`，简单封装了个 `fetch` 请求

<div flex items-center gap-1>
  <span icon i-mdi-github></span>
  <a href="https://github.com/imba97/me/commit/0e35aec4a8ea20a292e60bdfae67da5cc692c0d1">commit 0e35ae</a>
</div>

后面发现，其实图片是可以拿到的，只是最后要套一个 `Buffer.from(responseArrayBuffer)`

所以理论上 `@haverstack/axios-fetch-adapter` 应该也可以，拿到结果后转一下，虽然没试

但反正只是简单的请求，已经自己封装了，而且能去掉一个库也挺好
