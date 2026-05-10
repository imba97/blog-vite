---
id: 788
title: 阿里图标库工具 iconfontx
date: 2024-09-16 14:24:40
tags:
  - 工具
  - iconfont
  - iconfontx
categories:
  - 个人项目
---

# iconfontx

iconfontx 是一个免安装脚本，能将 `iconfont` 的样式和字体打包压缩成一个 `CSS` 文件在本地使用

# 场景

使用 `iconfont` 图标时，可以直接引入 `iconfont` 提供的 `CSS` 文件，但如果线上 `CDN` 出了问题或用户网络波动，会导致图标加载不出来的问题

所以按我之前公司的做法是，把样式和字体放在本地，并且会手动把字体文件转为 `base64`，并且每次添加图标后需要重复操作更新本地样式

# 使用

## help

```bash
npx iconfontx -h
```

展示帮助信息

```
Usage:
  $ iconfontx <url>

Commands:
  <url>  iconfont css url

For more info, run any command with the `--help` flag:
  $ iconfontx --help

Options:
  -o, --output <filename>  Output file path (default: D:\Projects\example\iconfont.css)
  -v, --version            Display version number
  -h, --help               Display this message
```

## 生成

首先复制 `iconfont` 提供的 `CSS` 文件链接

![](/uploads/2024/09/iconfontx-1.png)

执行命令

```bash
npx iconfontx //at.alicdn.com/t/xxx.css
```

默认会在当前目录生成 `iconfont.css` 文件，可以通过 `-o` 参数指定输出文件路径

引入样式后可以直接使用图标

![](/uploads/2024/09/iconfontx-2.png)

并且会压缩样式代码

![](/uploads/2024/09/iconfontx-3.png)
