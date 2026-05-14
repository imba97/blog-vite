---
id: 744
title: TypeScript 浏览器插件开发
date: 2021-07-06 20:40:50
tags:
  - TypeScript
  - 浏览器插件
  - Btools
categories:
  - 瞎研究
---

总结一篇 TypeScript 浏览器插件开发经验

# 推荐模块

1. [webextension-polyfill-ts](https://github.com/Lusito/webextension-polyfill-ts)

   浏览器插件API的TS包，开发插件必备

   <!--more-->

   ```javascript
   import { browser } from 'webextension-polyfill-ts'
   ```

   **避坑：**封装网络请求用`browser.runtime.onMessage.addListener`不能直接返回`axios`，虽然TS不会报错，但运行结果会是`undefined`

   正确方法：

   ```javascript
   browser.runtime.onMessage.addListener((request) => {
     const params
       = request.type === 'GET' ? { params: request.params } : { data: request.data }

     return new Promise((resolve, reject) => {
       axios({
         method: request.type,
         url: request.url,
         ...params,
         headers: request.headers || {}
       }).then((response) => {
         resolve(response.data)
       })
     })
   })
   ```

2. [write-json-webpack-plugin](https://www.npmjs.com/package/write-json-webpack-plugin)

    操作`json`文件的插件，用于修改`manifest.json`

    ```javascript
    // webpack.config.js
    const WriteJsonWebpackPlugin = require('write-json-webpack-plugin')
    // ...
    module.exports = () => {
      const manifestJSON = require('./src/manifest.json')
      // 版本号
      manifestJSON.version = '2.0.0'

      const config = {
        plugins: [
          manifestJSON
          && new WriteJsonWebpackPlugin({
            pretty: false,
            object: manifestJSON,
            path: '/',
            filename: 'manifest.json'
          })
        ]
      }
      return config
    }
    ```

3. [webpack-extension-reloader](https://www.npmjs.com/package/webpack-extension-reloader)

   自动重新加载插件，自动刷新插件作用的网页，测试神器

   ```javascript
   const ExtensionReloader = require('webpack-extension-reloader')
   // 也是 webpack plugins 以下就简单一写了
   const config = {
     entry: {
       content: './src/content.ts',
       background: './src/background/background.ts',
       popup: './src/popup/popup.ts',
       options: './src/options/options.ts'
     },
     // ...
     plugins: [
       new ExtensionReloader({
         reloadPage: true,
         // entry
         entries: {
           contentScript: 'content',
           background: 'background',
           extensionPage: ['popup', 'options']
         }
       })
     ]
   }
   ```

# Btools

最后宣传一下自己写的插件，Btools，以B站为主的网站页面优化，增强用户体验

现阶段正进行重构，使用`TypeScript`+`Vue`，欢迎参考：[Github](https://github.com/imba97/Btools-vue)、[Gitee](https://gitee.com/imba97/Btools-vue)

## 对流程的封装

Btools 分为两大模块：**Linstener 模块** 和 **Watcher 模块**

- Linstener 模块

  用于监听来自`background-js`的反馈，`background-js`会监听网页中指定的请求

  比如我需要获取页面上的评论，以前的做法是傻傻的用计时器循环获取页面元素，现在先通过`background-js`监听，如果监听到获取评论的API请求会发消息给`content-js`，接到消息后调用相应的模块

  这样做的好处是虽然也会用到计时器循环获取页面元素，但至少知道页面元素马上会加载好，一定程度上避免不必要的消耗

- Watcher 模块

  根据不同的网址进行不同的操作，举个例子：

  ```typescript
  import { HandleOptions, WatcherBase } from '@/Watcher/WatcherBase'
  export class GetPicWatcher extends WatcherBase {
    // 初始化函数中设置网址
    protected init(): void {
      this.urls[GetPicEnum.Video] = /bilibili\.com\/video/
      this.urls[GetPicEnum.Bangumi] = /bilibili\.com\/bangumi/
      this.urls[GetPicEnum.Watchlater] = /bilibili\.com\/medialist\/play\/watchlater/
      this.urls[GetPicEnum.Read] = /bilibili\.com\/read/
      this.urls[GetPicEnum.LiveRoom] = /live\.bilibili\.com/
    }

    // 处理函数
    protected handle(options: HandleOptions): void {
      // 父级调用时会把 GetPicEnum 的值传回来，这里就可以区分是哪个网址
      switch (options.index) {
        case GetPicEnum.Video:
          this.video()
          break
        case GetPicEnum.Bangumi:
          this.bangumi()
          break
        case GetPicEnum.Watchlater:
          this.watchlater()
          break

        case GetPicEnum.Read:
          this.read()
          break
        case GetPicEnum.LiveRoom:
          this.liveRoom()
          break
      }
    }

    video() {
      // ...
    }

    bangumi() {
      // ...
    }

    watchlater() {
      // ...
    }

    read() {
      // ...
    }

    liveRoom() {
      // ...
    }
  }

  // 用于区分网址
  enum GetPicEnum {
    /**
     * 视频页面
     */
    Video,

    /**
     * 番剧、电影
     */
    Bangumi,

    /**
     * 稍后再看
     */
    Watchlater,

    /**
     * 专栏
     */
    Read,

    /**
     * 直播间
     */
    LiveRoom
  }
  ```

## 对本地存储的封装

Btools 有着非常完善的本地存储封装，不同模块之间不会互相干扰

首先有一个模板基类

```typescript
export default class TemplateBase {
  private _name: string

  protected _data: Record<string, any>

  public constructor(data: Record<string, any>) {
    this._data = data
    this._name = (this as any).__proto__.constructor.name
  }

  public GetName(): string {
    return this._name
  }

  public GetData(): Record<string, any> {
    return this._data
  }

  public SetData(data: Record<string, any>): void {
    this._data = data
  }
}
```

这里的`_name`非常关键，其他模板类继承后被实例化事，这个`_name`就会变成子类类名，这就是不同模块之间不会互相干扰的关键

然后看一下某一个子类

```typescript
/**
 * 找回失效视频存储模板
 */

import TemplateBase from '@base/storage/template/TemplateBase'

export interface IVideoInfo {
  /**
   * 视频标题
   */

  title: string

  /**
   * 视频图片链接
   */
  pic: string
}

export interface IRetrieveInvalidVideo {
  videoInfo: { [key: string]: IVideoInfo }
}

// 这里继承了基类
export class TRetrieveInvalidVideo extends TemplateBase {
  constructor(data: IRetrieveInvalidVideo) {
    super(data)
  }
}
```

在构造函数中会把一个类型为`IRetrieveInvalidVideo`的参数传进去

然后是对本地存储的读写封装

```typescript
/**
 * 扩展本地存储
 */

import _ from 'lodash'

import { browser } from 'webextension-polyfill-ts'

import Singleton from '@/scripts/base/singletonBase/Singleton'
import TemplateBase from '@/scripts/base/storage/template/TemplateBase'

export default class ExtStorage extends Singleton {
  // ...
  getStorage<T extends TemplateBase, TResult>(
    configs: T
  ): Promise<TResult> {
    return new Promise((resolve) => {
      const space = new Object()
      space[configs.GetName()] = configs.GetData()

      browser.storage.local.get(space).then((items) => {
        resolve({
          ...configs.GetData(),
          ...items[configs.GetName()]
        })
      })
    })
  }

  setStorage<T extends TemplateBase, TResult>(
    configs: T
  ): Promise<TResult> {
    return new Promise((resolve) => {
      const space = {}
      space[configs.GetName()] = configs.GetData()

      browser.storage.local.set(space).then(() => {
        resolve(configs.GetData() as TResult)
      })
    })
  }
}
```

传进来的`config`类型是`TemplateBase`，这个类有个方法是`GetName`，也就是获取类名

存取时`space[configs.GetName()] = configs.GetData()`在外面包一层类名

这样即使是有重名，也是OK的

使用时是这样的：

```typescript
import {
  IRetrieveInvalidVideo,
  IVideoInfo,
  TRetrieveInvalidVideo
} from '@/scripts/base/storage/template'

export class RetrieveInvalidVideo extends ModuleBase {
  protected handle() {
    // 获取本地数据
    const localData = ExtStorage.Instance().getStorage<
      TRetrieveInvalidVideo,
      IRetrieveInvalidVideo
    >(
      new TRetrieveInvalidVideo({
        videoInfo: {}
      })
    )
  }
}
```

**避坑：**谷歌插件中，获取时传入一个默认值，如果没有读取到则会返回默认值。但火狐不会自动返回默认值，所以需要自己处理

也就是`扩展本地存储`代码中的`23`、`24`行，先解构传过来的`configs`，再解构读取到的`items`

比如我`configs`传入的`{ a: [], b: [] }`，但本地存储里只有`{ a: [1,2,3] }`

那么先解构`configs`获得`{ a: [], b: [] }`，再解构`items`会把`a`替换掉，获得`{ a: [1,2,3], b: [] }`

相当于自己封装了返回默认值

# 收工

OK，以上就是一些小总结，告辞
