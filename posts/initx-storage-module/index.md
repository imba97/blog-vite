---
id: 794
title: initx 存储模块
date: 2024-11-18 20:00:08
tags:
  - initx
  - 存储
categories:
  - 个人项目
---

# 简单演示

`initx` 的插件如果想在硬盘中存取数据，可以使用上下文中的 `store` 字段

```ts
interface Store {
  foo: string
}

export default class StarterPlugin extends InitxPlugin<Store> {
  defaultStore = {
    foo: 'bar'
  }

  matchers = [
    {
      matching: 'start',
      description: 'Plugin starter'
    }
  ]

  async handle({ store }: InitxContext<Store>, ...others: string[]) {
    store.foo = 'baz'
    // ...
  }
}
```

`initx` 将自动判断 `store` 字段是否被更改，如果有更改则会在执行器结束后将新数据保存到硬盘中

默认会先取硬盘数据，所以 `store.foo` 的值将会改为 `baz`

# 实现原理

在 `handle` 被调用前，`store` 会被创建

```ts
const store = createStore(context.packageInfo, this.defaultStore)
await this.handle({ ...context, store }, ...others)
writeStore(context.packageInfo.name)
```

而 `store` 其实是个 `Proxy` 对象，当 `store` 被更改时会将更改缓存下来

<!-- eslint-disable no-new -->
```ts
new Proxy(target, {
  get(target, key) {
    // ...
  },
  set(target, key, value) {
    const success = Reflect.set(target, key, value)
    rewritedCache = target
    return success
  }
})
```

最后会调用 `writeStore` 判断是否有更改

```ts
function writeStore(name: string) {
  if (!rewritedCache) {
    return
  }

  writeJson(resolveStore(name), rewritedCache)
}
```
