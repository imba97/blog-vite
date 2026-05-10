---
id: 757
title: 前端自动打包上传推送钉钉工具
date: 2022-10-27 23:52:06
tags:
  - 前端
  - 打包
  - 自动化
categories:
  - 个人项目
---

# 介绍

在一部分公司中，上线时前端需要打包后发给后端或运维同学，他们再放到服务器上

但每次打包、压缩、发给别人这个过程太麻烦了，于是就有了这个小工具

我们就可以简单配置一下，在打包结束后自动执行这个程序

![](/uploads/2022/10/simple-zip-upload-1.png)

并且可以直接下载压缩包

![](/uploads/2022/10/simple-zip-upload-2.png)

**好了，现在只要把后端骗进群，压力一下子就来到了后端这边**

除了自动展示版本、压缩包大小、打包日期之外

它还可以自动维护本地及线上的压缩包，每次执行时会检查非今天的文件，自动删除

# 使用方法

## 安装

```
pnpm i -D simple-zip-upload
```

## 导入

```javascript
import ZipUpload from 'simple-zip-upload'
```

## 配置

```javascript
const fs = require('node:fs')
const path = require('node:path')
const ZipUpload = require('simple-zip-upload')

const ZipUploadConfig = {
  sftpOptions: {
    // SFTP 连接信息
    connect: {
      host: '1.2.3.4',
      port: 22,
      username: 'root',
      privateKey: fs.readFileSync('C:\\Users\\imba97\\.ssh\\id_rsa')
    },

    // 必填，上传的远程目录
    remoteDir: '/www/download/upload'
  },

  // 应用名，唯一名称，会拼接在压缩文件名
  app: 'simple-zip-upload',

  // 版本号填充“0”的个数，可选，默认 2
  fill: 3,

  // 压缩目标文件夹
  zipTargetDir: 'dist',

  // 本地压缩文件存放目录
  zipFileDir: 'build',

  // 压缩文件下载连接，最后会与文件名拼接
  host: 'https://download.imba97.cn/upload/',

  // 钉钉推送卡片信息
  cardInfo: {
    title: '测试发布',
    subTitle: '没啥事就是测试一下',

    // 可选 默认是：
    // 版本 20221027005
    // 大小 1.00M
    // 打包日期 2022-10-27 23:57:31
    body(cardInfo) {
      return `
自定义内容
开头顶格写，不然会有空格
版本 ${cardInfo.version}
大小 ${cardInfo.size}
打包日期 ${cardInfo.date}`
    }

    // 可以是字符串
    // body: '自定义内容'
  },

  // 钉钉连接 token、secret
  dingTalk: {
    accessToken: '',
    secret: ''
  }
}
```

## 使用

### 普通

```javascript
// 普通
new ZipUpload(ZipUploadConfig).start()
```

### Webpack

```javascript
// ...
{
  plugins: [new ZipUpload(ZipUploadConfig)]
}
```

### vue.config.js

```javascript
// ...
export default {
  // ...
  chainWebpack(config) {
    // 添加插件
    config
      .plugin('ZipUploadPlugin')
      .use(ZipUpload)
      .tap(() => [ZipUploadConfig])
  }
  // ...
}
```

# 更多详情

[Github](https://github.com/imba97/simple-zip-upload)
