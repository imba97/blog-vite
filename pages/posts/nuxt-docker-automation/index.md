---
id: 786
title: Nuxt Docker 自动化
date: 2024-07-30 11:11:23
tags:
  - Nuxt
  - Docker
categories:
  - 瞎研究
---

# Nuxt

<span icon i-logos-nuxt-icon></span> Nuxt 是一个集成了前后端的框架，对于一些小型网站，不需要前后端分离的，是个好的选择

比如最近就做了一个 [me.imba97.com](https://me.imba97.com)，准备放一些关于我的一些东西

<!--more-->

# Docker

因为涉及到后端，需要 Node 环境，借助 `GPT` 简单写了个 <span icon i-logos-docker-icon></span> Dockerfile

```dockerfile
FROM node:18

# 创建并设置工作目录
WORKDIR /usr/src/app

# 复制所有源代码到工作目录
COPY . .

# 安装 pnpm
RUN npm install -g pnpm

# 安装项目依赖
RUN pnpm install

# 构建 Nuxt
RUN pnpm run build

# 暴露端口（默认端口为 3000，可以通过环境变量 NUXT_PORT 配置）
ENV NUXT_PORT=3000
EXPOSE ${NUXT_PORT}

# 启动 Nuxt.js 应用程序
CMD [ "pnpm", "start-docker" ]
```

`start-docker` 是以下命令

```sh
nuxt start --hostname 0.0.0.0 --port $NUXT_PORT
```

# Github Actions

配置了 <span icon i-logos-github-actions></span> Github Actions 自动打包镜像并发布

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build the project
        run: npm run build

      - name: Log in to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and tag Docker image
        run: |
          TAG_NAME=$(echo $GITHUB_REF | sed 's/refs\/tags\///')
          docker build . -t ${{ secrets.DOCKER_USERNAME }}/me:latest
          docker tag ${{ secrets.DOCKER_USERNAME }}/me:latest ${{ secrets.DOCKER_USERNAME }}/me:$TAG_NAME

      - name: Push Docker image to Docker Hub
        run: |
          TAG_NAME=$(echo $GITHUB_REF | sed 's/refs\/tags\///')
          docker push ${{ secrets.DOCKER_USERNAME }}/me:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/me:$TAG_NAME
```

# 部署脚本

我是部署在家里路由器上的，为了方便又简单写了个脚本

```sh
#!/bin/sh

docker stop imba97-me
docker rm imba97-me

docker pull imba97/me:latest

docker run -d --name imba97-me -p 3000:3000 --restart always imba97/me:latest
```

# 其他

虽然之前看到过有自动更新容器的方法，不过目前先这样了

Nuxt Docker 镜像倒是也有不少，但还是自己搞一个单独的了

# 开源

有兴趣可以看一下 <span icon i-mdi-github></span> [imba97/me](https://github.com/imba97/me)
