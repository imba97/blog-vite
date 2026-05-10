---
id: 766
title: GitLab Runner 初体验
date: 2023-07-27 22:10:31
tags:
  - GitLab
  - CI/CD
  - Runner
categories:
  - 工作
---

# 概念

`GitLab` 在跑流水线时需要配置 `runner`，`runner` 就是一个计算服务，说白了就是个一台电脑

根据流水线的步骤执行编译、打包、部署等工作

# 创建 Runner

首先在 `GitLab` 项目设置中创建 `runner`，拿到 `token`

`runner` 服务这里我用的 `Docker` 在软路由上安装的，`dockerhub` 上下载最高的是 `bitnami/gitlab-runner`

但我实际使用中在输入 `runner` 名称时会出现权限问题导致没法使用，所以我用了 `gitlab/gitlab-runner`

---

创建 `docker-compose.yml`

```yaml
version: '3.1'
services:
  runner:
    image: gitlab/gitlab-runner:latest
    container_name: gitlab-runner
    restart: always
    privileged: true
    volumes:
      - /home/runner/config:/etc/gitlab-runner
      - /var/run/docker.sock:/var/run/docker.sock
```

注册 `runner`

```bash
docker exec -it gitlab-runner gitlab-runner register
```

按照提示补全信息

```bash
# 输入 gitlab 地址
Enter the GitLab instance URL (for example, https://gitlab.com/):

# runner token
Enter the registration token:

# runner 名称
Enter a name for the runner. This is stored only in the local config.toml file:

# 选择执行器
Enter an executor: custom, shell, ssh, instance, docker-autoscaler, docker+machine, kubernetes, docker, docker-windows, parallels, virtualbox:
```

# 报错

`runner` 配置成功后跑的时候报了个错

```bash
$ npm install
bash: line 125: npm: command not found
ERROR: Job failed: exit status 1
```

是执行 `npm install` 的时候没找到 `npm`

# 解决

后面发现是选择执行器，我最开始选的 `shell`

只要在这一步选择合适的执行器，比如根据 `gitlab-ci.yml` 的需要

![](/uploads/2023/07/gitlab-runner-1.png)

我要用到 `node` 环境，所以这里可以选 `docker`

```bash
Enter an executor: custom, shell, ssh, instance, docker-autoscaler, docker+machine, kubernetes, docker, docker-windows, parallels, virtualbox:
docker

# 输入 Docker 镜像
Enter the default Docker image (for example, ruby:2.7):
node:18.15.0
```

即可解决
