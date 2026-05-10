---
id: 753
title: Rust 报错 link.exe was not found
date: 2022-03-28 20:23:18
tags:
  - rust
categories:
  - 笔记
---

# 报错简介

记录一个报错

刚开始学`Rust`，基本的一些环境安装完建了个项目后发现跑不了，报错：`linker link.exe not found`

![](/uploads/2022/03/rust-1.png)

后面给的提示也很明确，`please ensure that VS 2013, VS 2015, VS 2017 or VS 2019 was installed with the Visual C++ option`

少安装了一些环境

# 解决

1. 下载 [Build Tools](https://visualstudio.microsoft.com/zh-hans/visual-cpp-build-tools/)，等它自动下载安装

2. `Build Tools`相当于一个安装器，可以安装各种环境

   安装环境时选择**单个组件**，够两个即可：`MSVC v142 - VS 2019 C++ x64/x86 生成工具(最新)`、`Windows 10 SDK (xxx)`，版本号可能有区别

   ![](/uploads/2022/03/rust-2.png)

等安装完成后可能要重启，不出意外应该就能跑起来了
