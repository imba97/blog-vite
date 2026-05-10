---
id: 746
title: JSDoc 让JS有类型约束
date: 2021-09-10 20:45:13
tags:
  - javascript
  - typescript
  - vscode
categories:
  - jsdoc
---

这次我们来谈谈`JSDoc`，首先这是个啥，本质就是个注释，可以帮助开发工具认识你的代码。你可以通过它提升开发效率、降低运行时的错误率，更好的理解强类型语言。

主流编辑器应该都支持`JSDoc`，但我基本没用过别的所以不太清楚，本文章中演示用的编辑器均为`vscode`

<!--more-->

# JS中的类型

在`js`中，虽然类型的概念没那么强，但你依然无时无刻不在受到类型约束

比如最简单的`document.querySelector`

![](/uploads/2021/10/jsdoc-1.png)

它会返回一个`Element`类型的数据，页面元素的基础类型`HTMLElement`就继承了该类型

但这时如果你想修改`style`，你会发现它并不会给你提示，因为`style`是`HTMLElement`的属性

![](/uploads/2021/10/jsdoc-2.png)

# JS Doc

这时候，`JSDoc`就派上用场了。在你明确知道它类型的情况下，你可以直接声明变量的类型

```typescript
/**
 * @type {HTMLElement}
 */
const test = document.querySelector('.test')
```

此时再看代码提示，就出现了

![](/uploads/2021/10/jsdoc-3.png)

并且你可以开启类型检查

```typescript
// @ts-check
/**
 * @type {HTMLElement}
 */
const test = document.querySelector('.test')
```

此时如果你写的代码不规范，语法检查就会报错

![](/uploads/2021/10/jsdoc-4.png)

这样就可以在运行前排除掉大部分因为粗心导致的问题

# 常用字段

## @type

声明变量类型，类型写在`{}`中

```typescript
/**
 * @type {string}
 */
const str = 'string'
```

对象类型不能省略`{}`

```typescript
/**
 * @type {{
 *  name: string
 *  age: number
 *  info: {
 *    id: number
 *  }
 * }}
 */
const test = {}
```

![](/uploads/2021/10/jsdoc-5.png)

## @typedef

声明一个自定义类型，配合`@type`使用，你可以在类型后面起个类型名称

```typescript
/**
 * @typedef {{
 *  status: number
 *  message: string
 *  data: {[key: string]: any}
 * }} ResultData
 */

/**
 * @type {ResultData}
 */
const test = {}
```

![](/uploads/2021/10/jsdoc-6.png)

## @param

声明函数形参

```typescript
/**
 * 加法
 * @param {number} n1
 * @param {number} n2
 */
function sum(n1, n2) {
  return n1 + n2
}
```

![](/uploads/2021/10/jsdoc-7.png)

## @template

声明一个泛型，泛型相当于是一个类型的变量，我们最常用的数组，就用到了泛型`Array<T>`

如果定义`Array<string>`，说明这是个`string`的数组

这样你就可以有更好的语法提示

![](/uploads/2021/10/jsdoc-8.png)

比如我们可以封装一个简单的`findIndex`，类似`lodash`的一个函数，查找值的下标

```typescript
/**
 * @template T
 * @param {T[]} arr
 * @param {T} target
 * @return {number}
 */
function findIndex(arr, target) {
  let index = -1
  for (let i = 0; i < arr.length; i++) {
    let hasTarget = true
    const targetKeys = Object.keys(target)
    for (let j = 0; j < targetKeys.length; j++) {
      // 如果没值 || 不相等
      if (
        typeof arr[i][targetKeys[j]] === 'undefined'
        || arr[i][targetKeys[j]] !== target[targetKeys[j]]
      ) {
        hasTarget = false
        break
      }
    }
    // 如果 index 没值 && 有匹配的 target 则设置 index
    if (index === -1 && hasTarget) {
      index = i
      break
    }
  }
  return index
}

/**
 * @type {{
 *  name?: string
 *  age?: number
 * }[]}
 */
const test = [
  { name: '张三', age: 18 },
  { name: '李四', age: 20 },
  { name: '王五', age: 22 }
]

console.log(
  findIndex(test, {
    name: '王五'
  }),

  findIndex(test, {
    age: 20
  })
)
```

![](/uploads/2021/10/jsdoc-9.png)

此时如果类型与传递的数组不相符，则会报错

![](/uploads/2021/10/jsdoc-10.png)

其实这个例子举的不太好，因为那个函数本身只能传一个对象数组

但`js`也确实不好举例子，这个泛型跟`ts`比还是有缺陷的，它没法单独传类型参数，只能通过形参传递

如果是`ts`你可以封装一个请求类，对请求参数进行约束：[《请求接口类的封装》](/posts/738#TypeScript)

## 其他字段

还有一些不太常用的（我个人不常用），可以参考[官方文档](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)。

# 结语

OK，这次就说到这，这篇文章憋了20天

我太懒了，而且有些都是现研究的，之前研究这个泛型，一直想实现一个封装请求函数，自动提示返回参数，但实际比较难实现，因为就是上面说的`JSDoc`没法传递类型参数
