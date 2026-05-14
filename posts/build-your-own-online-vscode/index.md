---
id: 762
title: 搭建自己的在线 vscode
date: 2023-04-05 12:06:15
tags:
  - code server
categories:
  - 瞎研究
---

# 一张图

![](/uploads/2023/04/code-server-1.png)

# code-server

[code-server](https://coder.com/docs/code-server/latest) 是一个在线版的 `vscode`，跟其他在线编辑器不同的是，它包含服务端，通过 `WebSockets` 与主机通讯，这使得你可以搭建后端环境来编译、运行你的程序

跟本地 `vscode` 基本一致，可以非常方便的进行项目演示、合作开发等

# 启动

这里使用的是 `Docker` 部署

只需要下载 [docker-compose.yaml](https://github.com/imba97/code-server/blob/master/docker-compose.yaml)，配置相应的环境变量，然后执行 `docker-compose up -d` 即可

# 持续集成

参考 [monlor/docker-code-server](https://github.com/monlor/docker-code-server) 做了持续集成

使用 `Github Actions` 根据 `Dockerfile` 进行构建、发布镜像，根据自己需要进行了以下配置

- 给 `zsh` 装了个可可爱爱的主题

  ![](/uploads/2023/04/code-server-2.png)

- 安装了 `nvm`、`nodejs`、`yarn`、`pnpm`、`vue-cli` 等前端环境

- 安装了一些常用插件

- 自定义 `vscode` 用户配置

- 参考的项目里还带 `NPS`，正好需要就也保留了

有持续集成就方便多了，配置环境、安装软件、更改配置等只需要改一下相关的文件或者写写脚本、命令提交即可

# 后言

奈何现在不太会写 `shell` 脚本，之后慢慢会把这个镜像做大做强，这个东西可玩性真是太大了

Github: [imba97/code-server](https://github.com/imba97/code-server)
