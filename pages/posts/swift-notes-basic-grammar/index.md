---
id: 484
title: Swift 笔记 - 基础语法
date: 2020-02-07 23:51:41
tags:
  - swift
  - 语法
categories:
  - 笔记
---

## 变量、常量

```swift
// 定义变量
var a = 10;
// 定义常量
let b = 10;
```

<!--more-->

数字可以使用`_`或添加额外的`0`增加可读性

```swift
let a = 100_0000; // 1000000
let b = 001999; // 1999
```

字符串的拼接使用`+`，字符串嵌入变量使用`\()`

```swift
let hello = "hello"
print(hello + " world"); // hello world

let n = 100
let str = "n is \(n)"; // n is 100
```

可选类型，定义变量时设置可选类型，让变量可为 nil，因为调用某些函数时不一定会返回正确的结果

```swift
import Foundation
let url = NSURL(string: "http://www.baidu.com")
// 如果确认里面不是空，也可以使用“!”强制解析
print(url!)
```

## 布尔型

swift的布尔型只有`true`和`false`，不存在非零即真

## 数组

```swift
let array = ["a", "b"]
// 此时 array 自动获取到的类型是 String，之后就无法向数组追加其他类型的值
// 但可以手动指定 Any 类型
var array2 : [Any] = []
array2.append("string")
array2.append(10)
print(array2); // ["string", 10]
// 打印数组
for item in array2 {
  print(item)
}
// 输出 string 10
```

## 字典

与数组定义一样，也是用方括号，是键值对

```swift
let dict: [String: Any] = ["name":"Zhang San","age":17]
// 遍历
for (index, item) in dict {
  print("index: \(index), item: \(item)")
}
// 输出 index: name, item: Zhang San index: age, item: 17
```

## 元组类型

元组是由多个任意类型数据组成

```swift
let position = (x: 10, y: 20, z: 1.5)
// 访问
print(position.x)
print(position.0)
```

定义时可省略名称

```swift
let position = (10, 20, 1.5)
// 访问
print(position.0)
```

明确指定类型，但指定类型后就不能使用元素名了

```swift
let position: (Int, Int, Float, String) = (10, 20, 1.5, "hello")
```

声明变量可用元组来接收

```swift
var (x, y) = (10, 20)
print(x); // 10
print(y); // 20

var position = (10, 20)
var (newX, newY) = position
print(newX); // 10
print(newY); // 20
```

使用`_`来忽略接收某个值

```swift
var position = (10, 20)
var (_, newY) = position
print(newY); // 20
```

**空元组 === Void 类型**

## 范围运算符

范围运算符是`...`和`..<`，可以指定一个范围

```swift
let a = 0...5
let b = 0..<5
for i in a {
  print(i)
}
// a 会输出 0 到 5
// b 会输出 0 到 4
print(a); // 0..<6 会自动转换成 ..<
print(b); // 0..<5
```

## 溢出运算符

可以避免变量值超出该变量类型的限制
溢出运算符：`&+`、`&-`、`&*`、`&/`、`&%`

```swift
// 获取 UInt8 类型的最大值
let x = UInt8.max; // 255
let y = x + 1; // 此时会报错 因为超出最大值
// 改用溢出运算符
let y = x &+ 1; // 超出部分会从该类型的最小值开始计算  y == 0
```

## as

没有符号修饰的as一般只有三个地方会用，意义是做桥接

1. String as NSString
2. NSArray as [array]
3. NSDictionary as [String: AnyObject]

## 流程控制

流程控制语句必须要有大括号（除三目运算符）

### for-in

for-in 和 范围运算符

```swift
for i in 1...3 {
  print(i)
}
// 会打出 1 到 3
```

使用`_`忽略范围中的值

```swift
for _ in 1...3 {
  print("hi")
}
// 会打出3次“hi”
```

设置标签，可以在`break`指定标签，跳出指定的循环体

```swift
name:
for _ 1...3 {
  print("一次新的外层循环")
  for i in 1...5 {
    print(i)
    break name // 会跳出 name 这个循环，也就是外层循环
  }
}
// 会输出1次 “一次新的外层循环”和1次“1”
```

### if

可以不写括号

```swift
let n = 10
if n == 10 {
  print(n); // 10
}
```

### if-let

判断时声明变量，如果不为 nil 则给变量赋值，多用于判断可选类型

```swift
// 通常
func say(str: String?) {
  let v: String! = str
  if v != nil {
    print(v)
  }
}
// 使用 if-let
func say2(str: String?) {
  if let v = str {
    print(v)
  }
}
let s: String? = "hi"
say2(str: s); // hi
```

### guard-let

如果if中的代码会很长，可以使用 guard

```swift
// 通常
func say(str: String?) {
  let v: String! = str
  if v == nil {
    return
  }
}
// 使用 guard-let
func say2(str: String?) {
  guard let v = str else { return }
}
```

### switch

可以接收绝大多数类型，结束时不需要`break`关键字，每个`case`中至少包含一条可执行语句，必须包含所有可能的条件

多条件使用`,`分割

```swift
let number = 10;
switch number {
  case 10,11,12:
    print("通过")
  case 20:
    print("未授权")
  default:
    print("未知状态")
}
// 输出“通过”
```

switch 和 范围运算符

```swift
let number = 10;
switch number {
  case 10...12:
    print("通过")
  case 20:
    print("未授权")
  default:
    print("未知状态")
}
// 与上面的代码完全一致 输出“通过”
```

使用 switch 和 元组数据 和 用`_`忽略某个判断值，来判断某个点在下图什么位置

![](/uploads/2020/02/swift-1-1.png)

```swift
let point = (0, 0)
switch point {
  case (0, 0):
    print("在原点")
  case (_, 0):
    print("在X轴")
  case (0, _):
    print("在Y轴")
  case (-2...2, -2...2):
    print("在蓝色矩形框内")
  default:
    print("在蓝色矩形框外")
}
```

switch 的数据绑定，在匹配同时，可以将 switch 中的值绑定给一个常量或者变量

```swift
let point = (10, 5)
switch point {
  case (let x, 0):
    print("在X轴，X坐标：\(x)")
  case (0, let y):
    print("在Y轴，Y坐标：\(y)")
  case let (x, y):
    print("X坐标：\(x)，Y坐标：\(y)")
}
```

使用 switch 的数据绑定 和 where 判断条件成立，来判断某个点是否在下图紫线或绿线上

![](/uploads/2020/02/swift-1-2.png)

```swift
let point = (0, 0)
switch point {
  case let (x, y) where x == y:
    print("在绿线上")
  case let (x, y) wehre x == -y
    print("在紫线上")
  default:
    print("在其他位置")
}
```

#### fallthrough

执行完当前 case 后接着执行下一个 case 或 default，等于PHP不写 break 的效果

```swift
let num = 10;
switch num {
  case 10:
    print("10")
    fallthrough
  case 20:
    print("20")
  default:
    print("num 是其他值")
}
// 会输出 10 20
```

## 函数语法

### 定义函数

func 函数名(形参名) -> 返回类型

```swift
func sum(num1, num2) -> Int {
  return num1 + num2
}
```

定义无返回值函数

1. func 函数名(形参名) { 函数体 }

2. func 函数名(形参名) -> Void { 函数体 }

3. func 函数名(形参名) -> () { 函数体 }

返回元组的函数

```swift
func getPoint() -> (Int, Int) {
  return (10, 10)
}

func getPepole(id: Int) -> (name: String, age: Int) {
  if id == 1 {
    return ("Zhang San", 20)
  } else id id == 2 {
    return ("Li Si", 21)
  }

  return ("Unknown", 0)
}

var pepole = getPepole(id: 1)
print(pepole); // ("Zhang San", 20)
```

### 外部参数

定义外部参数，增加代码可读性

func 函数名(**外部参数名** 形参名) -> 返回类型

```swift
func addStudent(name: String, stu_age age: Int, stu_no no: Int) {
  print("添加学生：name: \(name)，age: \(age)，no: \(no)")
}
// 调用
addStudent(name: "Zhang San", stu_age: 20, stu_no: 19)
// 输出“添加学生：name: Zhang San，age: 20，no: 19”
```

函数默认是常量参数，如果需要变动参数的值，需要额外声明变量参数

```swift
func addStar(str: String) -> String {
    var str = str;
  for _ in 1...3 {
    str += "*";
  }
  return str;
}
var starStr = addStar(str: "hello")
print(starStr); // hello***
```

使用“_”忽略外部参数

```swift
func sum(_ num1: Int, _ num2: Int) -> Int {
  return num1 + num2;
}
var numSum = sum(1, 2)
print(numSum); // 3
```

忽略后就不能再写成 `sum(num1: 1, num2: 2)`

### 输入输出参数

类似于C语言中的指针

```c
// 定义指针参数
void change(int * a) {
  *a = 10;
}
int num = 20;
change(&num);
print(num); // 10
```

对比

```swift
func change(_ a: inout Int) {
  a = 10
}
var num = 20
change(&num)
print(num); // 10
```

### 闭包

类似于 OC 中的 block，在大括号内定义参数、返回值和函数体。
用 in 区分参数、返回值和函数体

```swift
let sumFunc = {
  (num1: Int, num2: Int) -> Int
  in
  let sumNum: Int = num1 + num2
return sumNum
}
let n = sumFunc(10, 20)
print(n)
```

如果没参数和返回值，那么 in 可以省略

```swift
let printStar = {
  print("***")
}
```

一般用于耗时操作的回调

```swift
func loadData(finshed: (html: String) -> Void) {
  dispatch_async(dispatch_get_global_queue(0, 0), { () -> Void in
    print("耗时操作 - 开启新线程")

    dispatch_async(dispatch_get_main_queue(), {
      print("完成 - 主线程")
      let htmlData = "<p>获取的HTML数据</p>"
      finshed(html: htmlData); //回调函数
    })
  })
}
// 调用并传入回调函数
loadData { (html) -> Void in
  print("执行回调函数")
}
```

### 尾随闭包

只是写法格式，如果一个函数的最后一个参数是函数类型，则可以使用以下写法

```swift
// 普通写法
dispatch_async(dispatch_get_global_queue(0, 0), { () -> Void in
  // 函数体
})
// 尾随闭包写法
dispatch_async(dispatch_get_global_queue(0, 0)) { () -> Void in
  // 函数体
}
```

### 异常捕获

```swift
let url = NSURL(string: "http://imba97.cn/wp-json/wp/v2/posts/484")
NSURLSession.sharedSession().dataTaskWithURL(url!) {
  // 尾随闭包的参数，可省略回调函数的参数
  (data, _, _) -> Void in
  // 函数体
  do {
    let resule = try NSJSONSerialization.JSONObjectWithData(data!, options: [NSJSONReadingOptions.MutableContainers, NSJSONReadingOptions.MutableLeaves])
    print(result)
  } catch { // 如果反序列化失败，能够捕捉到 json 失败的原因而不会崩溃
    print(error)
  }

  // guard let 方式
  guard let resule = try? NSJSONSerialization.JSONObjectWithData(data!, options: [NSJSONReadingOptions.MutableContainers, NSJSONReadingOptions.MutableLeaves]) else {
    print("反序列化失败")
    return
  }
}.resume()
```

## 与OC混写

Swift与OC可以互相调用

首先引入Swift的头文件，引用格式为`ProductName-Swift.h`，ProductName可以纯中文，但不能有包含中文、数字和“-”的组合，如果有可在`Build Settings -> Product Name`中更改

假设`Product Name`为`SwiftTest`

Swift的Person类：
```swift
import UIKit
class Person: NSObject {
  static func say() {
    print("这里是Swift的Person类")
  }
}
```

Objective-C调用Person
```objective-c
// OC 代码，加载Swift头文件
#import "SwiftTest-Swift.h"

@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  NSLog(@"%@", [Person say]);
}
@end

// DemoController.h
+ (void)say
// DemoController.m
import UIKit
class DemoController: UIViewController {
+ (void)say {
  NSLog(@"这里是OC的静态方法");
}
}
```

Swift调用OC的say只需引用相应头文件即可直接调用
```swift
#import DemoController.h
DemoController.say(); // 这里是OC的静态方法
```

Swift调用OC一般不会有问题，但OC无法访问Swift中的特输入法，如枚举
