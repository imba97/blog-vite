---
id: 800
title: initx v0.1.0 发布
date: 2025-04-08 22:39:17
tags:
  - initx
categories:
  - 个人项目
---

# 可圈可点

`initx` 是一个免安装的脚本引擎，可以使用 `npx` 执行，通过 <span icon i-mingcute-plugin-2-fill bg-primary></span> 插件实现各种功能

初期设计了匹配器和插件的核心逻辑

简单且强大的匹配器来匹配用户输入指令，后来单独抽离成了一个项目 <span icon i-mdi-github></span> [matchinitx](https://github.com/imba97/matchinitx)

# 美中不足

`initx` 可以免安装运行，但你需要全局安装各种插件，这显然是**不合理**的

虽然有一个插件管理器 `@initx-plugin/manager`，但它甚至也要先全局安装才能使用，这太傻了

# v0.1.0

在这个版本以及之前的几个版本中，陆续解决了以上的问题

首先插件不是全局安装了，而是被安装在用户目录下的 `.initx` 目录中

同时执行 `npx initx` 命令时，如果没有 `@initx-plugin/manager` 插件则会自动安装

现在你可以随时随地尝试

```bash
npx initx plugin list
```

**如果觉得每次输入 `npx` 比较麻烦，也推荐全局安装 `initx`**

```bash
npm i initx -g
```

# 解决需求

目前做的几个插件，以解决我自己日常使用需求为主，比如以下几个简单的例子

## 复制

比如复制 SSH 公钥、GPG 公钥、当前目录路径，你可以轻松解决

```bash
# 安装插件
initx plugin add cp
# 复制 SSH 公钥
initx cp ssh
# 复制 GPG 公钥
initx cp gpg
# 复制当前目录路径
initx cp cwd
```

## git 相关

安装

```bash
initx plugin add git
```

设置全局用户名、邮箱

```bash
initx user foo foo@bar.com
```

初始化或修改远程仓库地址

```bash
initx git@github.com:initx-collective/initx.git
# 带有分支
initx git@github.com:initx-collective/initx.git main
```

没错，直接这样贴上地址就好了，插件会自动判断是初始化还是修改仓库和分支

开启或关闭 GPG 签名

```bash
initx gpg true
initx gpg false
```

插件会自动找到 `gpg` 执行程序的路径，并设置 `git` 配置

## 项目管理

安装

```bash
initx plugin add pm
```

设置项目目录

```bash
# 相对路径
initx pm add .
# 绝对路径
initx pm add /home/foo/projects
# 指定名称
initx pm add frontend /home/foo/projects-frontend
initx pm add backend /home/foo/projects-backend
```

不指定名称默认是 `default`

基于 `github` 仓库创建项目到目录

```bash
initx pm create user/repo
# 别名
initx pm create user/repo as-name
```

修改默认项目目录

```bash
initx use frontend
# 不指定则修改为 default
initx use
```

更多文档可以在 <span icon i-mdi-github></span> [initx-collective](https://github.com/initx-collective) 对应的插件仓库中找到

# 插件开发

`initx` 插件开发的方向大致分为两个部分

1. 以功能为主，比如以上的 `cp`、`git`、`pm` 插件
2. 以个人为主，因为考虑到需要记各种命令，所以自己开发自己的插件，为自己服务也是一种选择

创建插件可以直接使用插件模板 <span icon i-mdi-github></span> [initx-plugin-starter](https://github.com/initx-collective/initx-plugin-starter)

开发时使用 `stub` 模式，这样修改完 `ts` 代码就不需要手动执行编译

```bash
pnpm stub
```

安装当前目录的插件

```bash
initx plugin add .
```

可以试试这个命令

```bash
initx start
```
