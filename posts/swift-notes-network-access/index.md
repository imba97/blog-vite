---
id: 491
title: Swift 笔记 - 网路访问
date: 2020-02-15 18:48:05
tags:
  - uncategorized
categories:
  - 笔记
---

## 基本的网络请求

```swift
let url = NSURL(string: "http://imba97.com/wp-json/wp/v2/posts/491")
NSURLSession.sharedSession().dataTaskWithURL(url!) {
  // 尾随闭包的参数，可省略回调函数的参数
  (data, _, _) -> Void in
  // 函数体
  // 1. 反序列化
  NSJSONSerialization.JSONObjectWithData(data!, options: [NSJSONReadingOptions.MutableContainers, NSJSONReadingOptions.MutableLeaves])
}.resume()
```

<!--more-->

`JSONObjectWithData`的`options`选项，OC中的按位枚举的方式改为数组的方式设置，如果不设置选项可以直接设为空数组`[]`

## 封装网络方法

使用`AFNetworking`框架进行二次封装，首先使用Cocoapods加载第三方框架

`NetworkTools.swift`文件

```swift
import UIKit
import AFNetworking

// 枚举
enum requestMethod: String {
  case GET = "GET"
  case POST = "POST"
}

class NetworkTools: AFHTTPSessionManager {
  // 单例
  static let sharedTools: NetworkTools = {
    let tools = NetworkTools(baseURL: nil)
    // 设置反序列化数据格式，系统会自动将OC框架中的NSSet转换成Set
    tools.responseSerializer.acceptableContentTypes?.insert("text/html")
    return tools
  }()
}

// 扩展方法
extension NetworkTools {
  func request(method: requestMethod, URLString: String, parameters: [String: Any]?, finished: (result: Any?, error: NSError?)->()) {
    // 成功回调
    let success = { (task: NSURLSessionDataTask, result: Any) -> Void in
      finished(result: result, error: nil)
    }
    // 失败回调
    let failure = { (task: NSURLSessionDataTask, error: NSError) -> Void in
      print(error)
      finished(result: nil, error: error)
    }
    // 判断GET或POST
    if method == requestMethod.GET {
      GET(URLString, parameters: parameters, success: success, failure: failure)
    } else {
      POST(URLString, parameters: parameters, success: success, failure: failure)
    }
  }
}
```

调用，`ViewController.swift`文件

```swift
import UIKit
class ViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    NetworkTools.sharedTools.request(requestMethod.GET, URLString: "http://imba97.com/wp-json/wp/v2/posts/491", parameters: nil) { (result, error) -> () in
      print(result)
    }
  }
}
```
