---
id: 737
title: PicGo 插件开发入门
date: 2021-01-06 14:10:44
tags:
  - picgo
  - extensions
  - typescript
categories:
  - 瞎研究
---

# PicGo

[PicGo](https://github.com/Molunerfinn/PicGo)是**一个用于快速上传图片并获取图片 URL 链接的工具**，可以把本地图片上传到图床并返回各种格式的链接

![](/uploads/2021/01/picgo-1.png)

<!--more-->

# 插件

PicGo支持插件开发，但官方教程并没有从零到安装成功的具体细节演示，只说了插件开发相关的一些东西

所以对新手的我来说还是碰到很多坑的，在此记录分享一下

# 入门教程

下面我会用PicGo给我们提供的[**插件开发模板**](https://github.com/PicGo/picgo-template-plugin)进行插件从零到安装成功的开发过程演示

## 全局安装 PicGo

```bash
yarn global add picgo
# or
npm install picgo -g
```

## 下载模板

```bash
picgo init plugin <your-project-name>
```

根据提示进行配置

```bash
[PicGo INFO]: Template files are downloading...
[PicGo SUCCESS]: Template files are downloaded!
# 插件名称
? Plugin name: test
# 插件简介
? Plugin description: 只是一个测试插件
# 作者
? author: imba97
# 开发模块（可多个，上下键移动，空格选择/取消）
? Choose modules you want to develop: uploader
# 是否只是命令行插件
? Your plugin is just used in CLI? No
# 用 TypeScript 还是 JavaScript
? Use TS or JS? ts
# 有没有快捷方式
? Your plugin has some shortcut for GUI? No
# 创建成功
[PicGo SUCCESS]:
Generate template files successfully!
Please cd C:\Users\imba97\Desktop\test, and then
# 接下来进入文件夹 安装依赖包
npm install
# or
yarn
```

## 编辑代码

`src`目录下默认有一个`index.ts`

```typescript
import picgo from 'picgo'

export = (ctx: picgo) => {
  const register = () => {
    // 添加一行日志输出试一下
    ctx.log.success('test 插件加载成功')
    ctx.helper.uploader.register('test', {
      handle(ctx) {
        console.log(ctx)
      }
    })
  }
  return {
    uploader: 'test',
    register
  }
}
```

## Build

这一步很重要，因为插件默认执行的是`dist/index.js`，这个配置在`package.json`中，如果没Build会安装失败

```bash
npm run build
# 输出
> picgo-plugin-test@1.0.0 build C:\Users\imba97\Desktop\test
> tsc -p .
```

之前不知道，一直卡在这一步

## 安装本地插件测试

复制你本地插件的目录，比如我的是：`C:\Users\imba97\Desktop\test`

来到配置文件所在的文件夹

- Windows: `%APPDATA%\picgo\data.json`
- Linux: `$XDG_CONFIG_HOME/picgo/data.json` or `~/.config/picgo/data.json`
- macOS: `~/Library/Application\ Support/picgo/data.json`

打开命令行，安装插件

```bash
npm install C:\Users\imba97\Desktop\test
```

不报错的话你就可以在插件列表里看到你的插件了

![](/uploads/2021/01/picgo-2.png)

把它设置成默认图床

![](/uploads/2021/01/picgo-3.png)

随便上传个东西，看一下日志有没有正常输出

```bash
2021-01-06 16:12:40 [PicGo SUCCESS] test 插件加载成功
2021-01-06 16:12:40 [PicGo INFO] [PicGo Server] is listening at 36677
```

修改代码后需要重新Build，或者直接`npm run dev`，开发模式有热更新，只需要重启应用即可

PicGo程序本体这边可以下载源码，运行`npm run electron:serve`进入开发模式，应该可以更方便的开发插件，但我用的时候会报错：

![](https://camo.githubusercontent.com/3589a6c41641bcdc27fb66cb246ef03cfc957c6e4b374a2b717c540e70dd5e0d/68747470733a2f2f692e6c6f6c692e6e65742f323032302f31322f30392f63747834466935477a4b616772496c2e706e67)

网上常见的解决方法无效，所以我的调试是无限`Build->重启应用`

## 卸载测试插件

卸载应该是需要手动删除，点卸载按钮的话会报错，具体需要删除以下几个东西，在配置文件同级目录中

- node_modules/测试插件**目录**（快捷方式）
- package.json 中的测试插件那一**行**
- package-lock.json **文件**
- data.json 中 picgoPlugins 中的测试插件那一**行**

也许有正确的卸载方式，只是我不知道，各位自行研究吧 233

## Log

如果遇到任何问题，首先建议检查 Log，Windows 的路径在：`C:\Users\<用户名>\AppData\Roaming\picgo\picgo.log`，其他系统不确定

应该是跟**配置文件**在一起的

# 告辞

OK，接下来你可以在[《插件开发指南》](https://picgo.github.io/PicGo-Core-Doc/zh/dev-guide/cli.html)获取更多教程，开启插件开发之路了
