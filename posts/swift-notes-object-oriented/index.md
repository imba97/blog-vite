---
id: 489
title: Swift 笔记 - 面向对象
date: 2020-02-09 22:59:20
tags:
  - swift
  - 类
  - 面向对象
categories:
  - 笔记
---

## 类的定义

所有的属性和方法都是全局共享的，不需要 import

```swift
import UIKit
// 定义 Person 类，继承自 NSObject
class Person: NSObject {

  // 对象属性应该可变的，可选项允许变量为空
  var name: String

}
```

<!--more-->

## 构造函数

给属性分配空间，设置初始值，父类提供了构造函数需要对父类的构造函数进行扩展，使用关键字`override`

```swift
import UIKit
class Person: NSObject {

  var name: String

  override init() {
    // name初始化只能在 super.init() 上面
    name = "Zhang San"
    super.init()
    // name = "Zhang San" 再此处写会报错
  }
}
// 实例化
let p = Person()
print(p.name); // Zhang San
```

## 函数重载

函数名相同，参数个数和类型不同

```swift
class Person: NSObject {
  var name: String
  var age: Int
  // 如果重载构造函数，系统默认构造函数就不能再被访问
  init(name: String, age: Int) {
    self.name = name
    self.age = age
  }
}
```

## KVC

Key-value coding，通过Key名直接访问对象属性或赋值，而不需要调用明确的存取方法

```swift
class Person: NSObject {
  var name: String?
  // 设置 age 的初始值，因为Int是基本类型，不存在 nil 的概念，所以不能写成 var age: Int?
  var age: Int = 0

  init(dict: [String: Any]) {
    super.init()
    setValuesForKeysWithDictionary(dict)
  }
}
// 实例化并传入参数 dict
let p = Person(["name": "Zhang San", "age": 20])
```

## 便利构造函数

能够提供条件检测，允许返回`nil`，默认的构造函数必须要创建对象，便利构造函数必须以`self.`的方式调用其他构造函数创建对象

```swift
class Person: NSObject {
  var name: String?
  var age: Int = 0

  init(dict: [String: Any]) {
    super.init()
    setValuesForKeysWithDictionary(dict)
  }

  convenience init?(name: String, age: Int) {
    if age < 0 || age > 100 {
      return nil
    }
    // 调用其他构造函数初始化属性
    self.init(dict: ["name": name, "age": age])
  }
}
let p = Person("name": "Zhang San", age: 101)
// 一般解包时需要用 ! ，但此时会报错
print("name: \(p!.name), age: \(p!.age)")
// 需要用 ? 来解包，表示如果p为nil，就不会继续调用后续的属性或方法
print("name: \(p?.name), age: \(p?.age)"); // name: nil, age: nil
```

对象释放方法，与`dealloc`类似，主要负责对象被销毁前的内存释放工作，不允许重载，不允许带参数，不允许直接调用，会先调用子类的释放函数再调用父类的

需要程序员销毁的内容

- 通知 (不注销不会崩溃)
- KVO (不注销会崩溃)
- NSTimer (会对target (self) 进行强引用)

```swift
class Person: NSObject {
  deinit {
    print("Person deinit")
  }
}
```

## 懒加载

本质上是一个闭包，第一次访问属性时会执行后面的闭包，将返回值保存在属性中，下次访问就不会执行闭包，直接获取属性的值

如果没有lazy，会在`initWithCoder`方法中被调用，当二进制的`storyboard`被还原成视图控制器对象后，就会被调用

```swift
import UIKit
class ViewController: UIViewController {
  // 懒加载 Person 类
  lazy var person: Person = {
    print("懒加载")
    return Person()
  }()

  // 还可以写成以下格式
  let personFunc = { () -> Person in
    print("懒加载")
    return Person()
  }
  lazy var demoPerson: Person = self.personFunc()

  // 懒加载的简单写法
  lazy var demoPerson: Person = Person()

  // 闭包中的 self. 是不能省略的
  var name: String? = "Zhang San"
  lazy var title: String? = {
    return "Mr " + (self.name ?? "")
  }
  // 输出 Mr Zhang San
}
```

## getter和setter

在Swift中极少用，仅供参考
OC中使用`getter`进行懒加载，而Swift提供了`lazy`关键字

```swift
class Person: NSObject {
  private var _name: String
  var name: String? {
    get {
      // 返回 _成员变量的值
      return _name
    }
    get {
      // 使用 _成员变量记录新的值
      _name = newValue
    }
  }
}
// 使用
let p = Person()
p.name = "Zhang San"
print(p.name); // Zhang San
```

## read only

只读属性，也叫<font color="red">计算型属性</font>，每次调用时都会执行大括号中的代码

只写`getter`方法

```swift
print var _name: String?
var name: String? {
  get {
    return _name
  }
}
// 只读属性可以简写，省略 get{}
var name: String? {
  return _name
}
```

### 懒加载与计算型属性的区别

懒加载

- 只计算一次
- 需要开辟单独的空间保存计算结果
- 闭包的代码再也不会被调用
- 如果计算量很大，需要提前准备

计算型属性

- 每次都要计算，浪费性能
- 不需要开辟额外的空间

## 类函数(静态函数)

```swift
import UIKit
class Person: NSObject {
  // 定义静态成员属性
  static var text: String = "Test"
  // 定义类函数(静态函数)
  class func staticFunc() {
    print("类函数")
  }
}
// 调用
```

## 单例

```swift
import UIKit
class Person: NSObject {
  // 定义静态成员属性
  static var instance: Person?
  // 定义标识，只让diepatch_once中的代码运行一次
  static var onceToken: dispatch_once_t = 0
  // 提供全局访问类
  class func person() -> Person {
    dispatch_once(&onceToken) { () -> Void in
      // 实例化类
      instance = Person()
    }
    // 强制解包并返回
    return instance!
  }
  // 单例的懒加载写法
  static let person2: Person = {
    return Person()
  }()
}
```

## extension

对在已存在的类、类型进行扩展，但不能覆盖现有功能

### 计算属性

```swift
extension Double {
  var km: Double { return self * 1000.0 }
  var m: Double { return self }
  var cm: Double { return self / 100.0 }
  var mm: Double { return self / 1000.0 }
  // 英尺
  var ft: Double { return self / 3.28084 }
}
// 使用
let threeFeet = 3.ft
print("3英尺是 \(threeFeet) 米"); // 3英尺是 0.914399970739201 米
```

### 扩展方法

以下例子是对`Int`使用，也可以对自定义的类使用

```swift
extension Int {
  func repetitions(task: () -> Void) {
    for _ in 0..<self {
      task()
    }
  }
}
// 使用（尾随闭包的形式）
3.repetitions {
  print("Hello"); // Hello Hello Hello
}
// 使用（普通传参）
3.repetitions(task: {
    print("Hello"); // Hello Hello Hello
})
```

## 视图模型

模型通常继承自`NSObject`，可以使用KVC设置属性，简化对象构造
而视图模型没有父类，所有内容都要从头构造

视图模型是封装业务逻辑，通常没有复杂的属性

```swift
import Foundation
class UserAccountViewModel {
  // 用户模型
  var account: UserAccount?
  // 构造函数
  init() {

  }
}
```

## 协议

类似接口，用于制定属性和方法，让其他遵守协议的地方实现

```swift
import UIKit
protocol Pet {
  // 协议属性，如果只有 get 则是只读属性
  var name: String { get set }
  // 协议方法
  func playWith()
  func fed()
}
class Animal {
  var type: String = "mammal"
}
// 继承父类同时实现协议，需要先写父类，再写协议
class Dog: Animal, Pet {
  var name: String = "Puppy"
  func playWith() {
    print("wong")
  }
  func fed() {
    print("I love Bones")
  }
}
```

## 属性观察者

在属性即将赋值、赋值后进行操作，默认赋值和`init`初始化方法中的赋值不会触发属性观察者

```swift
import UIKit
class person {
  var age = 0 {
    // 即将赋值时
    willSet(newAge) {
      print("原值：\(age)，即将被赋值为：\(newAge)")
    }
    // 赋值后
    didSet(oldAge) {
      print("原值：\(oldAge)，即将被赋值为：\(age)")
    }
  }
}
```
