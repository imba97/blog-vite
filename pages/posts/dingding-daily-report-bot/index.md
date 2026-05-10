---
id: 751
title: 钉钉日报机器人
date: 2022-01-09 19:46:56
tags:
  - 钉钉
  - 日报
  - 机器人
  - javascript
categories:
  - 个人项目
---

# 介绍

NodeJS 开发的一个根据 `git log` 自动生成日报的程序，并可以通过钉钉机器人发到群里

![](/uploads/2021/12/report-2021-5.png)

<!--more-->

# 开发契机

我们每天要写钉钉日报，最开始我是查看`git`的提交日志，然后选出有价值的提交

比如修复了什么问题、优化了什么功能等，像修改了配置文件、隐藏某些功能等就不会写到日报里

这样手动筛选挺麻烦，下班了还要现查`git`、现找有价值的提交

作为一个程序猿，当然不能麻烦了自己，于是就有了这个东西

# 使用

我目前是放在了公司电脑上，并设置了开机启动

也就是说我只要上班，电脑开着，它到时间就会自动收集今天`git`提交中带有前缀的内容，整理好并发到一个钉钉群里

## 拉取项目

Github：[dingtalk-report-robot](https://github.com/imba97/imba97_project/tree/master/dingtalk-report-robot)

```shell
git clone git@github.com:imba97/imba97_project.git
```

进入`dingtalk-report-robot`目录

## 安装依赖包

```shell
npm i
```

## 配置

打开`src/config.js`，进行配置

## 安装 pm2 和 自启动包

```shell
npm install pm2 pm2-windows-startup -g
```

`pm2`可以管理`NodeJs`项目，也用于开机启动

## 自启动包安装

```shell
pm2-startup install
```

## 启动项目

```shell
pm2 start 项目目录/src/ding-robot.js --name 名称
```

文件是`ding-robot.js`，注意别启动错了

## 保存

```shell
pm2 save
```

# 手动执行

程序可以使用`node`直接执行，手动执行后会自动复制到剪切板

## 获取日报

会根据配置文件的天数获取日报

```shell
node ./src/index.js
```

## 指定天数

获取今天的日报

```shell
node ./src/index.js 0
```

获取 7 天内的日报

```shell
node ./src/index.js 7
```

## 指定日期

获取指定日期的日报

```shell
node ./src/index.js 2023-07-14
```
