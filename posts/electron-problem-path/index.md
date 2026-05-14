---
id: 667
title: Electron 踩坑之 路径
date: 2020-07-30 00:11:43
tags:
  - bilibili_client
categories:
  - Electron
---

用 vue 脚手架创建的 electron-vue 项目

# 需求

程序启动后，打开某个页面会下载网络图片到本地，存到指定文件夹下

<!--more-->

# 问题

electron-vue 可以启动开发版：`npm run dev` 和生成安装包：`npm run build`

启动开发版时会创建一个 WebpackDevServer，使用的文件默认在 `项目/dist/electron`

但如果打包，安装后默认是在 `C:\Users\xxx\AppData\Local\Programs\项目名` 下

`开发`和`发布`路径不统一，使用`path`和`__dirname`获取到的路径也不一样，导致开发比较难受

electron-vue 虽然提供了一个`static`目录，但这个会在打包时被封装到 `...前略/项目名/resources/app.asar`中

这个`文件`中还存了所有页面、样式、库、等...

# 解决

使用`process.cwd()`获取当前进程工作目录

我在`main.js`中设置了一个全局变量，比如我需要一个用户数据文件夹，当用户登录时里面会存放用户的图片等相关文件

```javascript
// 全局常量
Vue.appSetup = Vue.prototype.$appSetup = {
  userDataDir: path.join(process.cwd(), 'userData')
}
```

获取到的目录分别是
开发：`...前略/项目/userData`
发布：`...前略/项目名/userData`

使用的时候

```javascript
// ...前略
created() {
  // 获取用户文件存放目录路径 拼接 UID，每个用户一个文件夹
  let userDirPath = path.join(
    this.$appSetup.userDataDir,
    this.userInfo.mid.toString()
  )
}
```
