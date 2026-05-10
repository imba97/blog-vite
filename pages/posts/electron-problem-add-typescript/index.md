---
id: 676
title: Electron 踩坑之 加入 TypeScript
date: 2020-08-05 01:23:16
tags:
  - electron-vue
  - typescript
  - vue
categories:
  - electron
---

# 原由

单纯用`javascript`其实还是有点局限性，比如枚举，虽然js中可以用对象实现，实际上就是定义一个对象，并让它`readonly`。但不如用`typescript`语法清晰明了。还有我一直想接触静态类型语言，包括之前想把`Btools`插件重制一下，目前也是用的`vue+typescript`起步了，不过搁置了。

<!--more-->

# 加入 TypeScript 的方式

## 直接安装

因为目前开发的项目是用的`electron-vue`<sup>([Github](https://github.com/SimulatedGREG/electron-vue))</sup>直接创建的，所以就想直接用包管理器进行安装，装好`typescript`和`ts-loader`写了个简单的测试页面，发现是能运行的。

但我完全不清楚`tsconfig.json`、`types`等各种配置文件需要如何配置，所以暂时放弃了这种方案。

## Vue 脚手架

网上查阅各种资料，发现可以直接用`vue init`创建一个`typescript`项目，然后用`vue add electron-builder`把`electron`的编译器添加到项目里，这种方式非常简单，配置文件都是别人做的现成的。

但问题它不是用的`webpack`，而是用的`vue-cli-service`。这个还好，但还有一个它会报错`fs.existsSync is not a function`，一直没能解决。

网上查的是执行线程问题，`fs`需要在主线程执行，而渲染线程获取不到。但目前找到的解决方法都没用。

## 梅开二度

最后实在没啥招，于是重回直接安装方案，毕竟也有配置文件可以参考了。于是参考了脚手架生成的各种文件和安装的库，最后总算是把整个框架搭的差不多了。

随之而来的也是各种问题。

# Vue 重复加载问题

转ts不容易，一路摸黑排错，以下总结一下问题和解决方式

## $attrs is readonly

这个问题我去网上搜的解决方法，90%都说是重新`npm install`、`npm update`就好，10%是说`Vue`重复加载会导致这个问题

## Unknown custom element

![](/uploads/2020/08/js2ts-1.png)

`[Vue warn]: Unknown custom element: <el-row>`

这个错误是`element-ui`的，在模板中使用了`<el-row>`应该被`element-ui`解析替换成`HTML`，但实际没有找到`element-ui`。

还有另一个类似的问题 ↓

## 内页 class 中无法获取某些值

在`main.ts`的`Vue`中定义了一些全局的东西，但在内页无法获取

```typescript
// 全局常量
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'

Vue.appSetup = Vue.prototype.$appSetup = {
  userDataDir: path.join(process.cwd(), 'userData')
}
Vue.use(ElementUI)
```

但在内页的`calss`里无效，内页：

```typescript
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class Index extends Vue {
  created() {
    console.log(Vue.appSetup) // undefined
    console.log(this.$appSetup) // undefined
  }
}
```

# Vue 重复加载问题的解决

其实总结以上原因，大致能猜出`main.ts`中的`Vue`和内页`class`中的`Vue`不是同一个东西

## 自己尝试的方式

```typescript
import Vue from 'vue'
import { Component } from 'vue-property-decorator'
```

就是`Vue`导出来源跟`main.ts`相同，`Component`装饰器从`vue-property-decorator`导出

但这种方式依然无济于事，于是各种搜索

## 发现可用方案

最后终于发现了一篇文章：[《关于electron-vue用typescript改写遇到的几个坑》](https://blog.csdn.net/weixin_41320468/article/details/102991716)
引用：
> 在我项目中的App.vue就加入了vue-property-decorator，它将组件改写成类，好了这里第一个大坑，就是 组件必须继承Vue,这个Vue又是从vue-property-decorator中引入的，我们必须在webpack.renderer.config.js配置一个东西:在whiteListedModules中多加一个vue-property-decorator的选项，否则每个组件都从vue-property-decorator引入一个Vue类，main.ts文件又import Vue from ‘vue’,之后webpack打包运行时会有多个vue的实例，Vue别名指向就不明确，vue组件无法识别已经注册好的<router-view ；之后倘若要引入vuex做状态化管理，也无法获取vuex里store存储的数据；vuex的数据改变了，template却无法渲染新的数据显示，而是会报错:"[Vue warn]: $attrs is readonly…found in …"

原来是需要在`webpack`配置文件中配置`whiteListedModules`，这样在打包的时候就不会出现多个`Vue`实例了

```javascript
const whiteListedModules = [
  'vue',
  'vue-property-decorator',
  'vue-class-component'
]

const rendererConfig = {
  // ...
  externals: [
    ...Object.keys(dependencies || {}).filter(
      d => !whiteListedModules.includes(d)
    )
  ]
  // ...
}
```

但我只添加`vue-property-decorator`依然不行，应该是因为`vue-property-decorator`的`Component`是`vue-class-component`中的，不把`vue-class-component`写进去应该也会创建多个`Vue`实例，所以最后就加了个`vue-class-component`发现没问题。

# types 的问题

`typescript`有类型检查，比如`Vue.appSetup`是我自己添加的属性，代码虽然能执行，但语法检查插件和编辑器是会报错的。

所以就需要各种`@types`，有些主流的软件包会自带类型声明，或者有些可以额外下载，比如`@types/node`、`@types/node-fetch`、`@types/request`等。

但如果是自定义的，需要自己写，`vue`的官方文档中也说了这个：<span class="vue">[**《TypeScript 支持 #增强类型以配合插件使用》**](https://cn.vuejs.org/v2/guide/typescript.html#增强类型以配合插件使用)</span>

# types 问题的解决

这里我需要给`Vue`加一个静态属性`appSetup`和一个实例属性`$appSetup`，你需要在项目目录下建一个文件，比如我是在`src`下建了个文件夹`types`

其实你不建文件夹也无所谓，因为`tsconfig.json`的`include`已经包含了`src`目录下的所有`.ts`等文件。

我在`types`文件夹中创建了一个类型声明文件`global.d.ts`，文件名可以随便起。

照着官方文档，写了

```typescript
// 模块补充
declare module 'vue/types/vue' {
  // 全局
  interface VueConstructor {
    appSetup: any
  }
  // 实例
  interface Vue {
    $appSetup: any
  }
}
```

于是编辑器就不会报错了，也有代码提示了。

这个地方卡了好久，最后发现自己sb了，没看到官方文档的全局、实例是分开的。我当时只写了其中一个，所以还是各种报错。

# 补充知识

如果`typescript`中用变量作为对象的下标，会报`any`类型的问题。

比如有个网络请求，回调返回`json`
```typescript
req('...', (json) => { // 绑定元素“json”隐式具有“any”类型
  console.log(json)
})
```

此时你需要声明类型。

```typescript
req('...', (json: { [key: string]: any }) => {
  console.log(json)
})
```

即可解决。
