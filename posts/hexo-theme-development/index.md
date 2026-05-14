---
id: 770
title: Hexo 主题开发 hexo-theme-imba97 —— 第零篇
date: 2023-10-14 16:18:28
tags:
  - hexo
  - 主题
categories:
  - hexo
---

# 使命

近一年中我了解到**数字游民**这个概念，就深受吸引，想逐步达成这一目标

不管以后找远程工作还是全职开源开发转商业化，都需要一个完善的开源项目

加上一直想自己动手做一个自己博客的主题，于是就有了这个项目

<!--more-->

# 地基

模板的开发是在 `Hexo` 默认模板的基础上，最开始没有直接写页面，而是丰富开发工具，会让开发变得更简单

## TypeScript

第一个就是 `TypeScript`，这让项目有更好的规范性，代码写起来也不容易出问题

## Rollup

主题开发在代码层面分为 `Hexo` 运行时执行的代码和实际博客页面中的代码

在开发或打包时，先使用 `tsc` 将 `ts` 编译为 `js`，再通过 `rollup` 根据不同目录转成相应格式的代码

比如 `Hexo` 运行时识别的 `cjs`，浏览器执行的 `iife`

## UnoCSS

`UnoCSS` 是个原子化 `CSS` 引擎，可以根据关键词生成具体的样式

这样就不用为 `class` 起名发愁了，并且按需生成，不会有大量重复样式

# 功能

除了自带的图片预览，目前还加了 `Pjax`、`nprogress`、`smooth-scrollbar`

开发层面有自动引入 `js` 库并支持权重，比如要在其他库之前引入 `jquery`，可以配置 `jquery` 的权重更高

并且可以方便的设置哪个库是用户可以在配置里控制开关的

# 开源

Github：[imba97/hexo-theme-imba97](https://github.com/imba97/hexo-theme-imba97)
