---
id: 802
title: PicGo 插件项目重构
date: 2025-05-11 23:13:45
tags:
  - PicGo
categories:
  - 瞎研究
---

# FTP 上传插件

这是一个四年前的项目，当时发现 PicGo 没有我需要的 FTP 上传插件，于是自己写了一个

最开始用的官方提供的插件模板，这是重构前的代码 <span icon i-mdi-github></span> [imba97/picgo-plugin-ftp-uploader/003b4e](https://github.com/imba97/picgo-plugin-ftp-uploader/tree/003b4e7b0278c92885efafed851bff84f3c54d4e)

前端技术发展迅猛，积累了四年的前端知识，让我有了重构的想法

# Refactor!

我当前开发前端库主要用以下技术

- <span icon i-vscode-icons-file-type-typescript-official></span> TypeScript 不用多说
- <span icon i-unjs-unbuild></span> unbuild 打包工具
- <span icon i-vscode-icons-file-type-eslint></span> eslint + @antfu/eslint-config 代码规范
- <span icon i-logos-git-icon></span> simple-git-hooks + lint-staged 代码提交规范
- <span icon i-stash-version-duotone bg-primary></span> bumpp 版本管理

## 打包工具

之前是直接用 `tsc` 编译，unbuild 作为一个现代化的打包工具，提供更灵活、自由度更高的配置、插件等，并能优化代码

## 规范

eslint 作为代码规范工具，开源魔法师托尼老师的 [@antfu/eslint-config](https://github.com/antfu/eslint-config) 提供了一套很好的规范，简单易用

simple-git-hooks 创建 git hooks，在提交前检查代码

lint-staged 只检查暂存的文件，避免全局检查

## 版本管理

bumpp 是一个简单的版本管理工具，命令行界面选择版本号，自动生成 git tag 并提交

## NPM 发布文件

`package.json` 中指定了需要发布的文件，因为打包会生成 `esm` 和 `cjs` 两种，避免发布多余文件

```json
{
  "main": "dist/index.cjs",
  "files": [
    "dist/index.cjs",
    "logo.png"
  ]
}
```

## 代码目录优化

把原来放在 `index.ts` 中的 `handle`、`upload` 拆分成单独文件

封装 `ftp` 客户端，让代码看起来更清晰

# PicGo 插件模板

PicGo 支持插件模板的开发，所以我基于上面的优化做了个插件模板

你可以使用以下指令初始化你的插件

```bash
picgo init imba97/picgo-template-plugin picgo-plugin-name
```

模板仓库 <span icon i-mdi-github></span> [imba97/picgo-template-plugin](https://github.com/imba97/picgo-template-plugin)

# 顺手

使用 `picgo init` 命令时发现一个问题，一个可选参数不写会报错，修了一下 ([#178](https://github.com/PicGo/PicGo-Core/pull/178))
