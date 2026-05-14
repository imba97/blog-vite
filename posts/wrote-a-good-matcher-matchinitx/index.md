---
id: 796
title: 写了个不错的匹配器 matchinitx
date: 2025-01-16 01:06:57
tags:
  - matchinitx
  - matcher
categories:
  - 个人项目
---

# matchinitx

`matchinitx` 前身是 <span icon i-mdi-github></span> [initx-collective/initx](https://github.com/initx-collective/initx) 项目中的功能，在插件中定义了匹配规则，然后 `initx` 会收集所有插件，根据用户在命令行输入的关键字，匹配、调用对应的插件

来看看它具体能干嘛

<!-- more -->

# 使用

```ts
import type { MatcherRules } from 'matchinitx'
import { useInitxMatcher } from 'matchinitx'
```

## 基础匹配器

匹配器默认规则类型是这样的，为了演示就简化的写一下

```ts
type MatcherRules<T> = T & {
  matching: (string | RegExp)[]
}
```

这个对象最后会返回给一个处理函数，但会把 `matching` 移除

所以我们需要自定义一些需要的字段，并且定义好匹配规则

```ts
interface CustomField {
  name: string
}

const rules: MatcherRules<CustomField> = [
  {
    matching: [
      'foo',
      /^bar/
    ],
    name: 'first'
  },
  {
    matching: [
      'test',
      /^t/
    ],
    name: 'second'
  }
]
```

然后需要一个处理函数，把它传给 `useInitxMatcher`

```ts
interface CustomResult {
  rule: CustomField
  others: string[]
}

function resultFn(rule: CustomField, ...others: string[]): CustomResult {
  return { rule, others }
}

const matcher = useInitxMatcher<CustomResult, CustomField>(resultFn)
```

`useInitxMatcher` 传入泛型可以让 `match` 结果有类型提示

匹配器执行后，通过 `resultFn` 处理后返回所有命中的结果

```ts
matcher.match(rules, 'foo')
matcher.match(rules, 'barfoo')
// [{ rule: { name: 'first' }, others: [] }]

matcher.match(rules, 'test')
// [{ rule: { name: 'second' }, others: [] }]

matcher.match(rules, 'top', 'extra')
// [{ rule: { name: 'second' }, others: ['extra'] }]
```

## 类型匹配器

如果你有多个匹配规则，并且这几个匹配规则都对应同一个类型，那么你可以使用以下写法

```ts
enum CustomType {
  FOO = 'foo',
  BAR = 'bar'
}

interface CustomField {
  title: string
}

interface CustomResult {
  rule: CustomField
  type: CustomType
  others: string[]
}

function resultFn(rule: CustomField, type: CustomType, ...others: string[]): CustomResult {
  return { rule, type, others }
}

const rules: MatcherRules<CustomField> = {
  [CustomType.FOO]: {
    matching: [
      'f',
      'o'
    ],
    title: 'a good matcher'
  },
  [CustomType.BAR]: {
    matching: [
      'b',
      'a'
    ],
    title: 'a good title'
  }
}

const matcher = useInitxMatcher<CustomResult>(resultFn)

matcher.match(rules, 'f')
matcher.match(rules, 'o')
// [{ rule: { title: 'a good matcher' }, type: 'foo', others: [] }]

matcher.match(rules, 'b', 'extra')
matcher.match(rules, 'a', 'extra')
// [{ rule: { title: 'a good title' }, type: 'bar', others: ['extra'] }]
```

具体应用场景，可以参考 [initx-plugin-git](https://github.com/initx-collective/initx-plugin-git/blob/main/src/index.ts) 中的代码
