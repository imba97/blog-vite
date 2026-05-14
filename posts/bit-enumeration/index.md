---
id: 747
title: 位枚举
date: 2021-10-17 22:43:36
tags:
  - JavaScript
categories:
  - JavaScript
---

# 位枚举是个啥

## 枚举

首先来说一下枚举，在一些语言中我们可以用`enum`等关键字定义枚举，它的作用是让值更易读

比如我们设置一个人的状态：吃饭、睡觉、打豆豆，分别为0、1、2

<!--more-->

如果我们在一个地方判断这个人当前状态是否是吃饭会用`status == 0`

但时间长了你可能就忘了0是指的什么，所以你还要需要去看

枚举就可以解决这个问题，以`C#`为例

```csharp
enum STATUS
{
    EAT,
    SLEEP,
    HIT_DOUDOU
};
```

使用时`status == STATUS.EAT`，我们就明确知道是在判断状态等于吃饭

在JS中也可以实现，就是自己定义变量的方式

```javascript
const STATUS = Object.freeze({
  EAT: 0,
  SLEEP: 1,
  HIT_DOUDOU: 2
})
```

其中`freeze`可以让这个对象不会被更改

## 位

位就是可以进行位运算（我的理解），比如`C#`可以用`Flags`将枚举标记为位域

```csharp
[Flags]
enum STATUS
{
    EAT = 1 << 0,
    SLEEP = 1 << 1,
    HIT_DOUDOU = 1 << 2
}
```

此时你可以这样判断`status.HasFlag(STATUS.EAT)`

但当判断项只有一个可能看不出它的优势，别急我们先用JS演示一下

# JS模仿C#位枚举

## 定义

定义方式与`C#`一毛一样

```javascript
const STATUS = Object.freeze({
  EAT: 1 << 0,
  SLEEP: 1 << 1,
  HIT_DOUDOU: 1 << 2
})
```

也可以直接设置为数字的 1、2、4，左移只是更易读

## 封装一个 HasFlag

```javascript
function hasFlag(enums, flags) {
  return flags === (enums & flags)
}
```

它的原理就是让**枚举**和**枚举变量**与(&)**枚举**对比

至于这种封装方式，我也不知道对不对，应该有更好的方法

## 发生了什么

假设我们有一个状态

```javascript
const status = STATUS.EAT
```

使用`hasFlag`

```javascript
hasFlag(status, STATUS.EAT)
```

等号左边的二进制是`0000 0001`

等号右边的二进制进行了与运算

```
0000 0001
&
0000 0001
=
0000 0001
```

最终结果是两边都是`0000 0001`，所以等式成立返回`true`

## 更令人舒适的

单看上面的方式，你完全可以用`status === STATUS.EAT`

但位枚举可以同时表述**一种以上**的状态，比如边吃饭边打豆豆

只需要加个或

```javascript
const status = STATUS.EAT | STATUS.HIT_DOUDOU
```

再使用`hasFlag`验证一下

```javascript
hasFlag(status, STATUS.EAT)
hasFlag(status, STATUS.HIT_DOUDOU)
hasFlag(status, STATUS.EAT | STATUS.HIT_DOUDOU)
```

以上均为`true`

## 状态的切换

位枚举切换状态非常简单，假设我正在边吃饭边打豆豆

```javascript
const status = STATUS.EAT | STATUS.HIT_DOUDOU
// 0000 0101
```

现在我要移除吃饭状态，添加睡觉状态，我只需要一个异或

<!-- eslint-disable no-global-assign -->
```javascript
status ^= STATUS.EAT | STATUS.SLEEP
```

异或就是相同为`0`，不同为`1`，所以就去掉了吃饭，添加了睡觉

```
0000 0101
^
0000 0011
=
0000 0110
```

（在梦里打豆豆）

## 除了某种状态

不存在某种状态时返回`true`，但写法得倒过来，条件状态在前

```javascript
hasFlag(~STATUS.EAT, status) // 除了吃饭
hasFlag(~STATUS.EAT & ~STATUS.SLEEP, status) // 除了吃饭和睡觉
```

# 告辞

目前我在`javascript`中用位枚举还比较少，只用过一次，不过我感觉这种方式能解决不少判断的问题

而且二进制，多少带点快，干净又卫生
