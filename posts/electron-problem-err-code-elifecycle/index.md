---
id: 672
title: Electron 踩坑之 ERR! code ELIFECYCLE
date: 2020-07-31 02:20:57
tags:
  - build
  - ELIFECYCLE
  - error
categories:
  - Electron
---

# 事情经过

执行`npm run build`报错

<!--more-->

# 报错

```bash
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! project_name@0.0.1 build: `node .electron-vue/build.js && electron-builder`
npm ERR! Exit status 1
npm ERR!
npm ERR! Failed at the project_name@0.0.1 build script.
npm ERR! This is probably not a problem with npm. There is likely additional logging output above.

npm ERR! A complete log of this run can be found in:
npm ERR!     E:\nodejs\node_cache\_logs\2020-07-30T18_05_50_819Z-debug.log
```

# 解决

这个问题应该是编译出现错误，但错误日志并不会明确提示错误信息，错误种类有很多，这里是其中一种。

经过<span style="color:red">**漫长**</span>的`git reset`，终于找到没报错能正常编译的位置，发现这个地方没使用`electron-store`，于是我又返回最新的一次push，注释掉所有跟`electron-store`有关的代码，发现果然能编译通过。

搜索`electron-store`导致的报错信息时发现一篇文章：[《electron-store在webpack打包中的Cannot find module "." 问题》](https://blog.csdn.net/flytam/article/details/78763992)

发现问题是我把`electron-store`装到了开发环境中，也就是安装时用的`npm install --save-dev electron-store`

看文章发现，实际上你需要安装在生产环境 `npm install --save electron-store`

重新安装在生产环境后，编译终于通过了！！！

![](/uploads/2020/07/electron-store.png)

<span style="font-size: 30px">真是个大坑，我吐了！</span>
