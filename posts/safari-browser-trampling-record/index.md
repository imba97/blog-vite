---
id: 773
title: Safari 浏览器踩坑记录
date: 2023-12-19 00:30:32
tags:
  - Safari
categories:
  - 笔记
---

# 音频加载

近期做了个小游戏，需要用到 `mp3` 文件，为了不让用户等待做了预加载，实现方式就是

```javascript
const audio = new Audio()
audio.src = '音频地址'
audio.load()
```

这样再监听 `canplay` 事件，即可拿到是否加载完成，加载多个并做了进度条

但后来朋友反馈发现，`iPhone` 手机进度一直是 0%，原因有两个

1. iOS 加载音频非 WIFI 下不能预加载，需要用户同意

   也就是 `audio.load()` 需要在一个用户操作事件中，比如 `onClick`

本想着这就解决了，在同一个点击事件里先加载，做了个异步，等待加载完成后继续执行播放，结果又不对了

2. 播放前不能有 `await`

   也就是调用 `audio.play()` 之前不能有 `await`，需要先执行加载，再进行播放

   于是最后做了设备类型判断，如果是 `iOS` 设备，就需要先点击加载音频，加载完后才会出现开始按钮

# 滚动回弹

近期工作中遇到了这个问题，`Safari` 浏览器如果滚动到最下面先停一下，然后还能继续往上拉，松开就有个很回弹的回弹

关掉这个效果很简单，在滚动元素上加个样式即可

```css
-webkit-overflow-scrolling: auto;
```

# 100vh 的问题

这也是工作中遇到的，最先是 `Safari ` 遇到的，但按理说是所有移动端浏览器都可能有的

正常写个 `100vh` 就是窗口高度，配合 `calc` 可以很方便的设置想要的高度，但移动端会有个问题

就是地址栏或者 `tab bar` 也会计算在 `100vh` 里，所以实际获取到的高度就是 **可视区域** + **tab bar**

![](/uploads/2023/12/safari-1.png)

> 图片来自 [https://web.dev/blog/viewport-units?hl=zh-cn](https://web.dev/blog/viewport-units?hl=zh-cn)

所以需要用 `svh`，这个单位可以减掉 `tab bar`

但实际有个问题就是，有些浏览器还没支持 `svh`，这就需要自己计算了，好在已经有人实现了类似的功能，使用这个库

```javascript
import 'large-small-dynamic-viewport-units-polyfill'
```

其实它实现的功能很简单，就是获取可视区域高度，并声明一个叫 `--1svh` 的 CSS 变量

```javascript
const svh = document.documentElement.clientHeight * 0.01
document.documentElement.style.setProperty('--1svh', (`${svh}px`))
```

使用时就使用 `calc` 自行计算 `calc(var(--1svh, 1vh) * 100);`，这样就相当于是 `100svh`

此时只需要写一个 `@supports` 根据浏览器支持自动选择用哪个即可

```css
@supports (height: 100svh) {
    height: 100svh;
}

@supports not (height: 100svh) {
    height: calc(var(--1svh, 1vh) * 100);
}
```

# 最后

上面说的小游戏在这里：[https://games.imba97.com](https://games.imba97.com)
