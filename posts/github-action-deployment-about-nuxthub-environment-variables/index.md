---
id: 790
title: Github Actions 部署 NuxtHub 项目使用环境变量
date: 2024-09-30 21:34:39
tags:
  - Nuxt
  - Github Actions
  - Cloudflare
categories:
  - 瞎研究
---

# 事情经过

最近在研究 NuxtHub 惹出来的事，部署过 [introxd.com](https://introxd.com) 之后爽到了，所以就想把我的简介 [imba97.me](https://imba97.me) 也部署到上面

但我的页面会用到加密环境变量，我在 NuxtHub 添加了环境变量，实际 NuxtHub 是调用 <span class="icon i-devicon-cloudflare"></span> Cloudflare 接口，环境变量会互相同步

在本地直接跑部署命令是可以的，但用 <span icon i-logos-github-actions></span> Github Actions 部署后，环境变量就没了，打印 `process.env` 是个空对象 `{}`

# 尝试解决

## 命名规则

使用 `NUXT_` 开头的命名规则，但无效

## 官方方法

使用 [Cloudflare 文档](https://developers.cloudflare.com/pages/framework-guides/deploy-a-nuxt-site/#access-bindings-in-your-nuxt-application) 中写的方法，可以拿到

但这种写法只能在 `defineEventHandler` 中使用

```ts
export default defineEventHandler(({ context }) => {
  const MY_KV = context.cloudflare.env.MY_KV
})
```

但我是写了个配置，类似

```ts
const commonConfig = {
  MY_KV: process.env.MY_KV
}
```

改成函数式，用的时候调用函数传值虽然可以，但**不优雅**

## runtimeConfig

网上有说需要在 `nuxt.config.ts` 的 `runtimeConfig` 里面添加

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    MY_KV: process.env.MY_KV
  }
})
```

但我试了，最终使用 `useRuntimeConfig` 会取到空字符串，因为 `process.env` 还是空对象

也试了把 `useRuntimeConfig` 从顶层放在函数中，也不行

# 解决方法

本地的打的包部署上去，`process.env` 是有值的，`runtimeConfig` 也能正常取到，所以考虑是 Github Actions 环境没有环境变量

测了一下，在打包的命令下加了，确实能拿到 `TEST`

```yml
env:
  TEST: test
```

所以就取了个巧，直接在 Github Actions 里面设置加密字段，直接把本地 `.env.local` 的内容复制进去

再在 Workflow 加个步骤，在打包之前写进 `.env` 文件里

```yml
- name: Write NUXT_PROJECT_ENV to .env
  run: echo "${{ secrets.NUXT_PROJECT_ENV }}" >> .env
```

然后在配置 `runtimeConfig`

```ts
export default defineNuxtConfig({
  runtimeConfig: {
    env: {
      NAVIDROME_API_URL: process.env.NAVIDROME_API_URL,
      NAVIDROME_USERNAME: process.env.NAVIDROME_USERNAME,
      NAVIDROME_PASSWORD: process.env.NAVIDROME_PASSWORD
    } as Record<string, string>
  }
})
```

最后在用的地方使用

```ts
const runtimeConfig = useRuntimeConfig()

export const axiosInstance = axios.create({
  baseURL: runtimeConfig.env.NAVIDROME_API_URL
})
```
