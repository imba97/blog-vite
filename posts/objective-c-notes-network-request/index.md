---
id: 421
title: Objective-C 笔记 – 网络请求
date: 2019-08-20 15:54:58
tags:
  - 网络请求
  - Objective-C
categories:
  - 笔记
---

获取页面数据

<!--more-->

```objective-c
- (void)viewDidLoad {
  [super viewDidLoad];
  // URL
  NSURL * url = [NSURL URLWithString:@"https://m.baidu.com"];
  // 请求
  NSURLRequest * request = [NSURLRequest requestWithURL:url];
  // 连接服务器
  [NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse * _Nullable response, NSData * _Nullable data, NSError * _Nullable connectionError) {
    // data是返回数据的16进制，需要转换
    NSString * html = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  }];
}
```

## 头信息

```objective-c
// URL
// 请求
NSMutableURLRequest * request = [NSMutableURLRequest requestWithURL:url];
// 头信息
[request setValue:@"iPhone" forHTTPHeaderField:@"User-Agent"];
// 发送请求
```

## 缓存

```objective-c
// URL
// 请求
NSURLRequest * request = [NSURLRequest requestWithURL:url cachePolicy:0 timeoutInterval:15.0]
// 发送请求
```

`cachePolicy`定义缓存的类型，是个枚举类型

- NSURLRequestUseProtocolCachePolicy = 0，默认缓存策略
- NSURLRequestReloadIgnoringLocalCacheData = 1，忽略本地缓存，新闻等APP常用
- NSURLRequestReturnCacheDataElseLoad = 2，返回缓存数据，如果没有缓存从服务器加载
- NSURLRequestReturnCacheDataDontLoad = 3，返回缓存数据，如果没有缓存，就空着

## 回调代码块

```objective-c
// 发送请求
[NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse * _Nullable response, NSData * _Nullable data, NSError * _Nullable connectionError) {
  NSLog(@"喵喵喵");
}];
```

参数

- response(NSHTTPURLResponse) 服务器的响应
 - URL 服务器返回的URL，绝大部分和请求的URL一样，重定向时不一样
 - MIMEType 二进制数据文件类型
 - expectedContentLength 下载文件的长度
 - textEncodingName 文本编码名称
 - suggestedFilename 服务器建议的保存文件名称
 - statusCode 状态码
 - allHeaderFields 所有相应头的内容
- data 返回数据
- connectionError 错误

## JSON反序列化

```objective-c
[NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse * _Nullable response, NSData * _Nullable data, NSError * _Nullable connectionError) {
  id result = [NSJSONSerialization JSONObjectWithData:data options:0 error:NULL];
}];
```

一个JSON对象应该具有以下属性

- 顶级节点是一个NSArray 或 NSDictionary
- 所有对象必须是NSString、NSNumber、NSArray、NSDictionary、NSNull
- 所有字典的key必须是NSString
- NSNumber 不能是无理数或空

`options`参数

- NSJSONReadingMutableContainers 容器节点是可变的
- NSJSONReadingMutableLeaves 子节点是可变的
- NSJSONReadingAllowFragments 允许顶级节点不是NSArray或NSDictionary

## PList反序列化

```objective-c
[NSURLConnection sendAsynchronousRequest:request queue:[NSOperationQueue mainQueue] completionHandler:^(NSURLResponse * _Nullable response, NSData * _Nullable data, NSError * _Nullable connectionError) {
  id result = [NSPropertyListSerialization propertyListWithData:data options:0 format:NULL error:NULL];
}];
```

`options`参数

- NSPropertyListImmutable 不可变
- NSPropertyListMutableContainers 容器可变
- NSPropertyListMutableContainersAndLeaves 容器和子节点都可变
