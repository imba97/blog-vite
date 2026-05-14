---
id: 743
title: Docker Nodejs 排坑笔记
date: 2021-05-20 22:54:47
tags:
  - Docker
  - Nodejs
categories:
  - Docker
---

# 原因

之前做了个B站机器人，可以以图搜番，这个功能需要用到 `ffmpeg` 将视频转成动图

如果想给别人用那么别人配置环境会很麻烦，就这样顺理成章的想到了 `Docker`

<!--more-->

# 排坑

初学 `Docker` 遇到不少坑

## 在Dockfile执行node

在这里卡了一天，我一直在搜“Dockerfile 容器 执行命令”

最后发现我傻了，我为什么不找个 `docker+node` 项目看看呢，官方都有说明

## Dockerfile 环境变量传入js中

在Github搜了搜项目发现，在js文件中可以直接用 `process.env.XXX` 获取环境变量
