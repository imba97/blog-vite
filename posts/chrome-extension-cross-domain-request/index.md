---
id: 434
title: Chrome插件跨域请求
date: 2019-08-30 12:58:05
tags:
  - API
  - chrome
  - javascript
  - 插件
  - 跨域
categories:
  - JavaScript
  - 瞎研究
---

Chrome插件中，可以跨域的地方只有`background js`和`popup js`这两个地方，`popup js`是右上角那个弹出页，只有弹出的时候才有效，所以定义跨域监听大概不现实

<!--more-->

这样只能在`background js`，我们需要在`background js`中定义一个监听函数，来监听其他页面传过来的信息。根据传来的值，判断是否是API请求

下面是一个有`get`和`post`的简易解决方案

```javascript
chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    switch (request.type) {
      case 'get':
        fetch(request.url)
          .then((response) => { return response.json() })
          .then((json) => { return sendResponse(json) })
          // eslint-disable-next-line node/handle-callback-err
          .catch((error) => { return sendResponse(null) })
        break
      case 'post':
        fetch(request.url, {
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: JSON.stringify(request.data)
        })
          .then((response) => { return response.json() })
          .then((json) => { return sendResponse(json) })
          // eslint-disable-next-line node/handle-callback-err
          .catch((error) => { return sendResponse(null) })
        break
        // 你可以定义任意内容，使用sendResponse()来返回它
      case 'test':
        sendResponse({ msg: 'test' })
        break
    }
  }
)
```

在其他页面你只需要这样调用

```javascript
chrome.runtime.sendMessage(
  {
    // 里面的值应该可以自定义，用于判断哪个请求之类的
    type: 'get',
    url: 'https://api.xxxx.com/api?a=1&b=2' // 需要请求的url
  },
  (json) => {
    console.log(json)
  }
)
```

进一步学习：[**官方文档**](https://developer.chrome.com/apps/xhr)
