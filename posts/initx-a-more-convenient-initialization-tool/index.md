---
id: 792
title: initx 更方便的初始化工具
date: 2024-10-21 21:44:29
tags:
  - initx
categories:
  - 个人项目
---

# 首先

`initx` 是一个免安装脚本，需要 <span icon i-logos-nodejs-icon-alt></span> Node.js 环境

# 一直在初始化

一直以来有个让我难受的点，就是一些初始化总会需要手动操作，比如换工作的新电脑、重装系统、创建新仓库，都需要进行大量重复的准备工作，有些甚至还有很多步骤

虽然大部分只需要配置一次，配置的时候查文档，但看完下次就忘了

# 比如

即使想完成一次简单的 <span icon i-logos-git-icon></span> Git 提交，你也需要先完成以下步骤

创建并到 `用户/xxx/.ssh` 目录下复制 SSH 公钥，然后添加到远程仓库用户配置中

```bash
ssh-keygen -t rsa -b 4096 -C "mail@example.com"
```

设置 Git 用户名邮箱

```bash
git config --global user.name "imba97"
git config --global user.email "mail@example.com"
```

设置 GPG 签名

```bash
git config --global commit.gpgsign true
git config --global user.signingkey XXX
git config --global gpg.program D:/GnuPG/gpg.exe
```

当然你也可以直接

```bash
git config --global --edit
```

把之前保存的配置直接粘贴进去，这样还稍微方便一点

但你依然也需要找到不知道备份到哪里的配置文件

# 再比如

你创建了一个远程仓库，你需要在本地创建目录，然后初始化仓库，添加远程仓库地址

```bash
git init
git remote add origin git@github.com:user/repository.git
```

如果你想修改远程仓库地址，你需要

```bash
git remote set-url origin git@github.com:user/repository.git
```

不常用的话很难记，特别是一堆参数的

<h1 id="init" text-center>init 🛠</h1>

<p text-center font-bold>非常骄傲的为你介绍</p>

`initx` 是我为自己做的一个能快速完成这些步骤的工具，如果它也能帮到你，那就太好了

## 中心思想

首先 `initx` 的中心思想是，能用最少的命令完成最多的事情，不需要记忆大量的命令和参数

## 比如

解决上面的“比如”，只需要一下几个简单的命令

创建 SSH 密钥并且执行

```bash
npx initx cp ssh
```

这样就免去找到文件打开复制的麻烦

然后设置用户名和邮箱

```bash
npx initx user imba97 mail@example.com
```

设置开启 GPG 签名，会自动找到并配置 GPG 可执行文件

```bash
npx initx gpg true
```

设置 GPG 签名密钥

```bash
npx initx 92038B3E14C0D332542FB082B851A3E43D739400
```

这样就完成了所有的配置

## 再比如

解决上面的“再比如”只需要一个命令

```bash
npx initx git@github.com:user/repository.git
```

如果在没有初始化的目录下执行，会自动初始化仓库

如果已经初始化过，会修改远程仓库地址

# 开源

你可以在 <span icon i-logos-github-icon></span> [initx-collective/initx](https://github.com/initx-collective/initx) 查看具体文档和代码

核心机制就是一个匹配器和一个执行器，如果命中了多个匹配器，则显示 `description` 的内容，让用户选择

```ts
export default class GitHandler extends InitxHandler {
  matchers = {
    [GitMatcher.Init]: {
      matching: [
        /^(https?|git):\/\/.*\.git$/,
        /^(git@.*\.git)$/,
        /^ssh:\/\/git@.*\.git$/
      ],
      description: 'Initialize a new git repository'
    },

    [GitMatcher.User]: {
      matching: 'user',
      description: 'Set user name and email for git configuration'
    },

    [GitMatcher.Gpg]: {
      matching: 'gpg',
      description: 'Enable or disable GPG signing for git commits'
    },

    [GitMatcher.GpgKey]: {
      matching: /^[A-F0-9]{40}$/,
      description: 'Set GPG key for git commits'
    }
  }

  async handle({ key }: InitxOptions, type: GitMatcher, ...others: string[]) {
    switch (type) {
      case GitMatcher.Init: {
        repositoryHandle(key, ...others)
        break
      }

      case GitMatcher.User: {
        userHandle(others)
        break
      }

      case GitMatcher.Gpg: {
        const [switchFlag] = others
        gpgHandle(switchFlag)
        break
      }

      case GitMatcher.GpgKey: {
        gpgKeyHandle(key)
        break
      }
    }
  }
}
```

主要功能稳定后可能会支持插件开发，你可以自定义自己的指令包发布到 npm 上
