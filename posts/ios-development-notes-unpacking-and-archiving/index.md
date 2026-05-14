---
id: 497
title: Swift 笔记 – 归档和解档
date: 2020-02-20 22:56:30
tags:
  - swift
  - 归档
  - 解档
categories:
  - Swift
---

# 使用

使用归档和解档来保存用户数据

归档：把当前对象保存到磁盘前，将对象编码成二进制数据
解档：从磁盘加载二进制文件，转换成对象调用

<!--more-->

```swift
import UIKit
// 使用归档解裆前需要遵守 NSCoding 协议
class UserAccount: NSObject, NSCoding {
  // NSCoding 协议中必须有两个方法需要实现
  var userName: String?
  var userToken: String?
  var expiresDate: NSDate?
  var userDevices: String?
  func encodeWithCoder(aCoder: NSCoder) {
    aCoder.encodeObject(userName, forKey: "userName")
    aCoder.encodeObject(userToken, forKey: "userToken")
    aCoder.encodeObject(expiresDate, forKey: "expiresDate")
    aCoder.encodeObject(userDevices, forKey: "userDevices")
  }
  // 需要用 required 关键词修饰，标识必须的、没有继承性，所有的对象只能解档出当前的类对象，每个类必须各自实现解档方法
  required init?(coder aDecoder: NSCoder) {
    userName = aDecoder.decodeObjectForKey("userName") as? String
    userToken = aDecoder.decodeObjectForKey("userToken") as? String
    expiresDate = aDecoder.decodeObjectForKey("expiresDate") as? String
    userDevices = aDecoder.decodeObjectForKey("userDevices") as? String
  }
  // 调用归档解裆方法
  func saveUserAccount() {
    // 保存路径
    var path = NSSearchPathForDirctoriesInDomains(.DocumentDirectory, .UserDomainMask, true).last!
    // 拼接文件名
    path = (path as NSString).stringByAppendingPathComponent("account.plist")
    // 调用归档，self 是归档对象
    NSKeyedArchiver.archiveRootObject(self, toFile: path)
  }
}
```

一般归档不需要保存成`plist`，但开发中必须确认数据是否正确的保存下来了，为方便查看保存成`plist`格式

使用视图模型进行解裆

```swift
import Foundation
class UserAccountViewModel {
  // 用户模型
  var account: UserAccount?
  // 用户登录标记
  var userLogin: Bool {
    // 如果 token 有值，并且没过期，则是有效登录
    return account?.userToken != nil && !isExpired
  }
  // 归档保存的路径
  private var accountPath: String {
    let path = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true).last!
    return (path as NSString).stringByAppendingPathComponent("account.plist")
  }
  // 判断 token 是否过期
  private var isExpired: Bool {
    // 用户数据与当前系统时间作比较
    if account?.expiresDate?.compare(NSDate()) == NSComparisonResult.OrderedDescending {
      return false
    }
    return true
  }
  // 构造函数
  init() {
    account = NSKeyedUnarchiver.unarchiveObjectWithFile(accountPath) as? UserAccount
    // token 过期清空解裆数据
    if isExpired {
      print("已经过期")
      account = nil
    }
  }
}
```
