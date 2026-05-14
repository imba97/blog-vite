---
id: 789
title: NuxtHub (Cloudflare) 部署 Nuxt 项目卡住的问题
date: 2024-09-20 14:50:30
tags:
  - Nuxt
  - NuxtHub
categories:
  - 瞎研究
---

# 事情经过

很早之前看到过 NuxtHub，但注册了半截，到绑定 <span class="icon i-devicon-cloudflare"></span> Cloudflare 那就暂时弃坑了

最近 <span class="icon i-vscode-icons-file-type-nuxt"></span> Nuxt 用的非常上头，同时也在用 Cloudflare，昨天逛 Github 发现个项目，看到官网下面写着 `Deployed on NuxtHub`

一时间来了兴趣，想看看 NuxtHub 是个啥

# NuxtHub

NuxtHub 是一个对接 Cloudflare Workers、Pages 的后台，同时提供 Nuxt 模块，比如数据库、KV、AI 等

可以非常方便的部署包含前后端的 Nuxt 项目

# 问题

把最近在做的 Nuxt 项目部署上去的时候发现，本地打包后用命令部署是没问题的

但用 Cloudflare 部署就会卡在下面日志的地方

```
...
15:53:04.900 [info] vite v5.4.6 building for production...
15:53:04.930 [info] transforming...
15:53:06.277 Deprecation [legacy-js-api]: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
15:53:06.324 Deprecation [legacy-js-api]: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.
16:29:21.641 Failed: build exceeded the time limit and was terminated. Refer to https://developers.cloudflare.com/pages/platform/limits/#builds for build limits
```

最后会构建超时，部署失败

# 排查

因为本地打包也会报这个 <span class="icon i-vscode-icons-file-type-sass"></span> Sass 的警告，所以本来感觉不是这个的问题

后面尝试用了官方的 Demo 部署，发现正常，经过对比发现是 Sass

代码中使用 `<style lang="scss">` 就会有这个警告，但又不能不用

# 解决

搜了一下发现是要在 `nuxt.config.js` 中加上

```ts
{
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler'
        }
      }
    }
  }
}
```

这样确实不报警告了，`transforming...` 后面也会正常走，但新问题是都完成后进程不会退出，还是一直卡在那

于是我想了个折中的方案，我自己写个脚本跑构建命令，通过日志输出判断是否构建成功，再手动退出进程

```ts
import { spawn } from 'node:child_process'
import process from 'node:process'

const child = spawn('npx', ['nuxi', 'build'])

child.stdout.on('data', (data) => {
  process.stdout.write(data)

  if (!~data.indexOf('npx nuxthub deploy')) {
    return
  }

  console.log('Build Success')

  setTimeout(() => {
    process.exit(0)
  }, 3000)
})
```

搞定 ✔
