---
id: 736
title: Typescript 浏览器插件开发 chrome/browser 代码提示
date: 2021-01-05 00:11:21
tags:
  - extensions
  - typescript
  - vue
  - webpack
categories:
  - 瞎研究
---

# chrome/browser

这两个是浏览器为插件开发提供的API，Chrome浏览器的变量名叫`chrome`，火狐浏览器的变量名叫`browser`

<!--more-->

# 代码提示

我用的编辑器是vscode，之前一直不明白怎么给这两个变量添加代码提示

## 最早尝试

最开始我想的是加一个全局变量，搜到可以在`.eslintrc`配置中添加一个`globals`，把变量名加进去，但后来发现这个东西跟代码提示没半毛钱关系。这是`ESLint`的配置文件，它的功能只是代码检查。

问过插件开发的大佬，大佬只说导入Library啥的，当时的我亿脸懵逼。

## typings

看了github上的各种插件，发现有一个`@types/chrome`，`typings`是TypeScript的定义管理器，描述命名空间、接口、变量等各种东西，`@types/chrome`呢也就是别人写好的一个描述文件，去告诉编辑器我这里有个`chrome`变量，它下面有哪些方法之类的。

使用npm安装

```bash
npm install --save-dev @types/chrome
```

安装好后发现`chrome`的代码提示有了，但只有`chrome`，火狐浏览器的`browser`依然没有。

## 自定义typings

前几天突发奇想，因为vue是可以自定义全局和实例变量的代码提示的，那么`browser`也许能自定义，于是照着这个思路，搜了一下怎么新建一个描述，去“继承”`chrome`

其实非常简单，只需要创建个文件，比如我在`src/typings/`下创建了一个`browser.d.ts`。这里具体在哪个文件夹下无所谓，读取这个文件是在`tsconfig.json`中配置的

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts"
  ]
}
```

意思就是，加载`src`目录下的包括所有文件夹中的`.ts`、`.d.ts`文件，所以只是创建在`src`目录下就行

然后在这个文件里添加

```typescript
declare const browser: typeof chrome
```

这样就有`browser`变量了

## 添加vue变量

再新建一个`vue.d.ts`，在里面添加

```typescript
import Vue from 'vue'
declare module 'vue/types/vue' {
  interface Vue {
    $chrome: typeof chrome
  }
  interface VueConstructor {
    chrome: typeof chrome
  }
}
```

更多详情可参考vue官网的说明：[《TypeScript 支持》](https://cn.vuejs.org/v2/guide/typescript.html#增强类型以配合插件使用)

以上，代码提示添加完成

# 使用示例

然后你就可以给Vue的chrome赋值，以`background.ts`为例，里面封装了一个网络请求

```typescript
import axios from 'axios'
import Vue from 'vue'

Vue.chrome = Vue.prototype.$chrome = chrome || browser

Vue.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const headers = typeof request.headers !== 'undefined'
    ? request.headers
    : {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36'
      }

  switch (request.type) {
    case 'get':
      axios.get(request.url, headers)
        .then((response) => {
          sendResponse(response.data)
        })
      break
    case 'post':
      axios.post(request.url, request.data, headers)
        .then((response) => {
          sendResponse(response.data)
        })
      break
  }

  return true
})
```

然后`popup.ts`中，也需要加入

```typescript
import Popup from '@components/popup'
import Vue from 'vue'
import '@styles/popup'

Vue.chrome = Vue.prototype.$chrome = chrome || browser

export default new Vue({
  components: {
    Popup
  },
  render: h => h(Popup)
}).$mount('#app')
```

在`popup.vue`中使用

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <span>{{ message }}</span>
    <input v-model="uid" type="text" value="" placeholder="输入UID">
    <button @click="btn">
      请求数据测试
    </button>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Popup extends Vue {
  title = 'Popup'
  message = ''
  uid = ''

  public btn() {
    if (this.uid === '') {
      this.message = '未输入UID'
      return
    }

    this.$chrome.runtime.sendMessage({
      type: 'get',
      url: `https://api.bilibili.com/x/web-interface/card?mid=${this.uid}&photo=1&jsonp=jsonp`
    }, (json) => {
      console.log(json)
      if (typeof json.data !== 'undefined') { this.message = `获取成功！昵称：${json.data.card.name}，当前粉丝数：${json.data.card.fans}` }
    })
  }
}
</script>
```

其他细节可查看Github项目：[Btools-vue](https://github.com/imba97/Btools-vue)

# 总结

1. 如果typescript项目用到的某变量没有代码提示可在npm搜索`@types/xxx`查找

2. typings完全可以手写，只是比较麻烦

3. 为一个变量声明类型可以用`typeof xxx`

   之前想到了在typings文件中声明，但不知道得用typeof，一直报错：namespace不能作为类型使用

# 更新

2021-07-06 更新，发现有一个插件API的包[webextension-polyfill-ts](https://github.com/Lusito/webextension-polyfill-ts)，直接引入就可以用
