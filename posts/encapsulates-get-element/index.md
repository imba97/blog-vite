---
id: 591
title: 封装了个 getElements()
date: 2020-05-08 00:56:59
tags:
  - typescript
categories:
  - TypeScript
  - 浏览器插件
---

做插件需要用到的，因为插件比页面元素加载的快，并且有些页面还是js渲染内容的

所以就需要一个计时器循环检查页面中是否有我需要的元素，于是这个`getElements()`就出来了

<!--more-->

放在了一个工具类中

```typescript
export default class Util {
  private static _instance: Util

  public static instance(): Util {
    if (typeof this._instance === 'undefined') {
      this._instance = new Util()
    }
    return this._instance
  }

  /**
   * 获取页面上的元素，10秒内如果没获取到则停止获取
   * @param selector 选择器
   */
  public getElements(selector: string): Promise<NodeListOf<Element>> {
    return new Promise((resolve, reject) => {
      let timeout = 20
      const timer = setInterval(() => {
        const elements: NodeListOf<Element> = document.querySelectorAll(selector)

        // 成功获取
        if (elements.length !== 0) {
          resolve(elements)
          clearInterval(timer)
        }

        // timeout
        if (timeout === 0) {
          reject(new Error('Empty NodeListOfElement'))
          clearInterval(timer)
        }

        timeout--
      }, 500)
    })
  }
}
```

[Github →](https://github.com/imba97/Btools-vue/blob/master/src/scripts/util.ts)

用了`Promise`，简洁易读。多个Elements还可以直接用`Promise.all()`挨个遍历出来，舒适

```typescript
import HKM from './hotKeyMenu'
import Util from './util'
const UtilInstance = Util.instance()

const avatar = UtilInstance.getElements('.avatar')
const span = UtilInstance.getElements('#primaryChannelMenu>span')

Promise.all([avatar, span]).then((nodeLists) => {
  nodeLists.forEach((elements) => {
    elements.forEach((element) => {
      new HKM(element).add([
        {
          key: 83,
          title: '测试',
          action() {
            alert('测试')
          }
        }
      ])
    })
  })
}).catch((error) => {
  UtilInstance.console(error, 'error')
})
```

[Github →](https://github.com/imba97/Btools-vue/blob/master/src/scripts/viv.ts)

不过有个问题，`Promise.all()`的话如果其中一个没获取到，那整个就返回错误了。如果我想让获取到的返回成功，没获取到的返回错误，大概得遍历`[avatar, span]`，其实也OK

那个`new HKM()`，是最近要做的“快捷键菜单”，至于是个什么东西，有兴趣的话可以看一下：[《快捷键菜单》](https://btools.cc/hot-key-menu/)，用jQuery写的，这次打算用原生js重构一遍

快捷键菜单源码：[Github →](https://github.com/imba97/Btools/blob/master/core/Btools.js#L139)
TypeScript版快捷键菜单：[Github →](https://github.com/imba97/Btools-vue/blob/master/src/scripts/hotKeyMenu.ts)

# 后言

被ES6爽到，也被TypeScript语法爽到，可以指定类型，vs code 直接就有相应的接口提示，太舒服了 —— 来自PHP程序猿的叫好

我可能是个假程序猿
