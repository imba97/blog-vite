---
id: 779
title: 狠狠地美化我的 VS Code
date: 2024-05-02 12:01:12
tags:
  - vscode
  - 美化
categories:
  - 瞎研究
---

# 上图

![](/uploads/2024/05/vscode-1.png)

首先，大多数配置来自托尼老师的方案，详情请看 <span icon i-mdi-github></span> [antfu/use](https://github.com/antfu/use)

不愧是托尼老师！

<!--more-->

# 契机

最开始看托尼老师的视频，发现虽然都是用的 <span icon i-vscode-icons-file-type-vscode></span> VS Code，但感觉完全是两个软件

配色、动画效果、错误提示、快速切换项目、闭合指示等等，每一个都让我狠狠地羡慕了

后来通过一些教程找到了错误提示插件 [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens)，快速切换项目的快捷键 `Ctrl + R`，但其他的一直没发现

再到前几天，发现了托尼老师专门开了个项目分享自己的配置。太贴心了，这必须狠狠抄袭一波！

# 基本配置

来自 <span icon i-mdi-github></span> [antfu/use](https://github.com/antfu/use)

<span icon i-icon-park-twotone-theme text="#c36858"></span> 主题：[Vitesse Theme](https://marketplace.visualstudio.com/items?itemName=antfu.theme-vitesse) - Vitesse Dark Soft

<span icon i-ic-baseline-insert-emoticon text="#c19999"></span> 图标：[Carbon Product Icons](https://marketplace.visualstudio.com/items?itemName=antfu.icons-carbon)

<span icon i-material-symbols-font-download-rounded text="#00a000"></span> 字体：[Input Mono](https://input.djr.com/download/)

<span icon i-material-symbols-light-settings-rounded text-yellow></span> 配置：[antfu VS Code settings](https://github.com/antfu/vscode-settings/blob/main/.vscode/settings.json) - 根据自己需要微调

# code-server

`code-server` 中使用 `Vitesse Theme`，目前插件市场中只有老版本，只能使用 `Vitesse Light` 和 `Vitesse Dark`

![](/uploads/2024/05/vscode-2.png)

但可以通过下载 `vsix` 文件手动拖到里面来安装最新版本

# 终端

<span icon i-streamline-warning-triangle-solid text-yellow></span> 目前使用 `WSL ZSH` 有个关键步骤没解决，就是 Git 提交时 `GPG` 加密，慎重将终端切换为 `WSL ZSH`

因为我是 Windows 系统，没法直接用 `ZSH`，只能通过 `WSL` 安装

其实设置完以上主题、配置后，终端就已经很好看了，其实完全可以用默认的，我之前是 `PowerShell`

之后会发一下 `WSL ZSH` 折腾的记录
