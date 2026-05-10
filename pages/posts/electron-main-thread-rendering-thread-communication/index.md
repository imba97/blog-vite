---
id: 752
title: Electron 主进程与渲染进程通讯
date: 2022-02-13 16:29:49
tags:
  - electron
  - electron-vue
  - 进程通讯
categories:
  - Electron
---

# Electron 的通讯机制

Electron 在运行时分为**主进程**和**渲染器进程**(渲染进程)，**主进程**可以用`NodeJS`的 api，**渲染进程**可以用浏览器的 api

两者之间需要通过 Electron 提供的 api 来通讯

<!--more-->

## 渲染进程

首先需要在渲染进程设置一个监听器，用来监听主进程发来的消息

然后主动发送一个消息给主进程

```javascript
// 监听器
ipcRenderer.on('mainSend', (event, message) => {
  console.log('主进程发来的消息', message)
})

// 在合适的地方发送给主进程，比如按钮点击事件中
button.onclick = function () {
  ipcRenderer.send('rendererSend', 'xxx')
}
```

## 主进程

接下来是主进程中，需要创建一个监听器，用来监听渲染进程发过来的消息

```javascript
ipcMain.on('rendererSend', (event, path) => {
  // 这里是主进程的处理，比如渲染进程发来的是一个文件路径
  // 主进程可以调用 NodeJs 的 api
  fs.unlink(path)
  // 删除后在告诉渲染进程已经删掉了
  event.sender.send('mainSend', `${path} 已删除`)
})
```

至此，渲染进程的监听器`mainSend`会接收到消息，`xxx 已删除`

## 带来的问题

个人感觉这种写法比较难受，因为我加一个通讯，就得写一遍上述内容

最少的情况也是**主进程**和**渲染进程**各要写一个，最后会有大量的`on`、`send`

# electron-vue-event-manager

于是解决方案出现了，`electron-vue-event-manager`是个基于`electron-vue`的事件管理器

可以让你在任意地方创建监听器，在任意地方触发它（发起广播）

**它能解决如下问题**

- **主进程**与**渲染进程**通信
- **渲染进程**自身的通信 (同一窗口内`Vue`组件之间)
- **渲染进程**与**其他渲染进程**通信 (不同窗口之间)

## 初始化

既然每个通信都需要一个`on`和一个`send`，那其实我只需创建一次

再通过不同的参数区分具体是什么通讯，不就解决了每种通讯要创建一个`on`和`send`的问题了

`electron-vue-event-manager`的解决方案正是如此，在**主进程**和**渲染进程**中调用各自的初始化函数

```typescript
// 主线程 (需要把所有创建的窗口传进去)
EventManager.Instance().mainInit([
  {
    // 创建的窗口，类型 BrowserWindow
    window: window1,
    // 类型，唯一标示
    type: 'window1'
  },
  {
    window: window2,
    type: 'window2'
  }
])

// 渲染进程
EventManager.Instance().rendererInit()
```

## 监听器

然后就可以在任何地方写一个监听器，比如下面这个是在**渲染进程**中，`Vue`的某个页面的`created`生命周期中

```typescript
// Window2 添加监听事件
EventManager.Instance().addEventListener<string>(
  // 事件类型 (string)
  EventType.Window1SendMessage,
  // 接收到广播后的回调函数
  (window1Message) => {
    this.message = window1Message
    console.log('接收到来自 Window1 的消息：', window1Message)
  }
)
```

## 广播

广播指的是调用监听器，监听器可以有多个，相当于收音机，所以**调用**这个动作叫做广播

以下是在**另一个渲染进程**中

```typescript
// Window1 进行广播
EventManager.Instance().broadcast<string>(
  // 事件类型 (string)
  EventType.Window1SendMessage,
  // 参数 (输入框内容)
  this.inputValue
)
```

## 实际应用

以上的代码实际应用如下图，你可以从`Window1`发送消息给`Window2`

也可以在`Vue`组件之间传递

![](/uploads/2022/02/electron-vue-event-manager-1.png)

## 网络请求

除了跨窗口、跨组件通信之外，还有**网络请求**是需要封装的

因为渲染进程是个浏览器窗口，发起网络请求也就会有**跨域问题**

所以你需要先让**渲染进程**把请求相关的数据发给**主进程**，再由**主进程**发起网络请求，拿到数据后发回**渲染进程**

在`electron-vue-event-manager`基于`axios`封装好了一个方法，可以在任何地方调用即可发起网络请求

```typescript
EventManager.Instance().sendRequest({
  url: 'Request URL',
  method: 'POST'
}).then((data) => {
  console.log(data)
})

// EventManager.Instance().sendRequest(options) === axios(options).then(response => response.data)
```

# 使用

<div style="display: flex; align-items: center;">
    <p>当前<img src="https://img.shields.io/npm/v/electron-vue-event-manager?label=electron-vue-event-manager&style=flat-square" style="display: inline; margin: 0 5px;" /></p>
</div>

`1.0.0`之前为**自用版**，因为还有很多没完善

目前能做到像上述的功能一样，但可能存在问题，**谨慎使用**

你可以在 [Github](https://github.com/imba97/electron-vue-event-manager)、[Npmjs](https://www.npmjs.com/package/electron-vue-event-manager) 获取到更多信息
