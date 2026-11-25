---
id: 821
title: '一个随时启动的日志收集工具'
date: 2026-11-25 20:01:57
tags:
  - 日志
  - 工具
categories:
  - 个人项目
---

# 日志

日志埋点上报一直存在一个矛盾，一边是 99% 的日志上报毫无作用，一边又害怕埋点不够细致，真出现问题无法复现完整链路

这个工具一定程度上可以缓解这个问题，把重要的日志如支付、订单留给像 SLS、观测云这种付费厂商，繁杂而全面的日志对接则交给 flash-debug

# flash-debug

flash-debug 是一个基于 Node.js 环境的工具，可以方便的启动

```bash
npx flash-debug
```

![](/uploads/2026/11/flash-debug-1.png)

默认本地启动服务并使用 `trycloudflare.com` 作为对外访问地址

你可以通过配置 `.env` 配置自己的域名

```ini
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=
FLASH_NEXUS_MODE=named
FLASH_NEXUS_ZONE=acewill.dev
FLASH_NEXUS_SUBDOMAIN=fd-{rand:4}
```

![](/uploads/2026/11/flash-debug-2.png)

# 底层库

flash-debug 基于 [flash-nexus](https://github.com/flash-nexus) 实现，而 flash-nexus 又分别基于 flash-tunnel 和 flash-dns 实现网络隧道和域名解析的能力

目前默认支持 Cloudflare 作为域名解析和隧道服务提供商，你也可以基于适配器开发其他提供商的支持

# skills

你可以使用

```bash
pnpx skills add flash-debug-js/skills
```

轻松实现任何编程语言对接 flash-debug

# 开源

{link:github:flash-debug-js/flash-debug}
