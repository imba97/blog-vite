---
id: 311
title: Objective-C 笔记 – 03
date: 2019-08-08 11:44:43
tags:
  - define
  - import
  - Objective-C
categories:
  - 笔记
---

## 类

<!--more-->

```objective-c
// Person.h 声明
#import <Foundation/Foundation.h>
@interface Person : NSObject
- (void) funcname
+ (void) funcname
@end

// Person.m 实现
#import "Person.h"
@implementation Person
- (void) funcname {
  NGLog(@"Hello OC");
}
+ (void) funcname {
  NGLog(@"Hello OC");
}
@end
```

## 减号方法

也叫对象方法

- 声明

```objective-c
- (void) funcname
```

- 调用

```objective-c
// 实例化类
Person *p1 = [[Person allot] init];
// 然后再调用
[p1 funcname];
```

## 加号方法

也叫类方法、静态方法

- 声明

```objective-c
+ (void) funcname
```

- 调用

```objective-c
直接调用
[Person funcname];
```

## 方法传参

```objective-c
// 一个参数
- (void) funcname:(int)a

// 多个参数
- (void) funcname:(int)a and:(int)b
```

方法名包括冒号，甚至可以声明下面的方法

```objective-c
- (void):(int)a :(int)b
```

## propterty

生成get、set方法、属性变量

```objective-c
// Person.h
#import <Foundation/Foundation.h>
@interface Person : NSObject
{
  // 可以不写
  int _age;
  NSString *_name;
}

@property(nonatomic, assign) int age;
@property(nonatomic, assign) NSString *name;

- (void) say();

@end

// Person.m
#import "Person.h"
@implementation Person

// 可以不写
@synthesize age = _age;
@synthesize name = _name;

- (void) say() {
  NGLog(@"my name is %s", _name);
  NGLog(@"my name is %s", self.name); // self.name等于[self name]
}

@end
```

- 参数1
 - `natomic` 原子属性（线程安全），需要消耗大量资源
 - `nonatomic` 非原子属性（非线程安全），适合内存小的设备

- 参数2
 - `assign` 直接赋值
 - `strong` 强引用，销毁后指向的内存数据也会被销毁
 - `weak` 弱引用

- 参数3
 - `readonly`只能读取（只生成get方法）

set方法是`setAge`，变量名第一个字母大写
get方法是`age`，变量名
直接可以调用

```objective-c
Person *p = [[Person alloc] init];
[p age]
```

使用`@propterty`后也可以定义`setOne`方法来进行重写set、get方法

注意自动生成的get方法可能会造成泄漏，可以改为以下写法

```objective-c
- (void)setName:(char*)nameValue {
  // 自动生成的是 name = nameValue;
  if(nameValue) {
    if(name != nameValue) {
      // 释放空间
      free(name);
      // 置空（好像可以不写）
      name = NULL;

      // 获取nameValue的长度
      int len = StrLength(nameValue) + 1;
      // 设置长度
      name = (char*) malloc(len);
      // 赋值
      strcpy(name, nameValue);
    }
  }
}
```

## synthesize

合成指令，在 Xcode 4.5 之前非常常见

## 点表达式

```objective-c
p.age = 20;
// 等于 [p setAge:20]

NGLog(@"age = %d", p.age);
// 等于 [p age];
```

点表达式如果做左值，就是调用set方法，如果做右值则是调用get方法

## static 关键字

```objective-c
void func() {
  static int a = 0;
  int b = 0;
  a++;
  b++;
}

// 如果多次调用
func(); // a = 1 ,b = 1
func(); // a = 2, b = 1

// static int a = 0; 只会被执行一次，把a放入静态存储区
```

## self 关键字
类似this这种

## 前置声明

也叫不完全声明

```objective-c
// .h
@class ClassName

// .m
import "ClassName.h"
```

告诉编译器，这是个类，但类中有什么方法不会加载进来
可以直接在`.h`文件中导入`ClassName.h`，但运行效率低，不推荐

## dealloc

析构函数，用来释放内存空间
需要在编译设置`Build Phases > Compile Sources > 相应的文件`加上`-fno-objc-arc`表示手动维护内存

```objective-c
// Person.m
- (void) dealloc {
  [super dealloc]
  NGLog(@"dealloc function called");
}

// main.m
Person *p = [[Person alloc] init];
// 手动释放
[p release];
// 释放后dealloc会被自动调用
```

现在有arc机制，自动维护内存

## 初始化传参

首先需要自定义一个初始化函数，函数名必须以`init`开头，并遵循以下规则

1. 判断参数有效性
2. 初始化父类
3. 初始化实例变量

```objective-c
// Person.h
- (id)initWithName:(NSString*)nameValue age:(int)ageValue;

// Person.m
- (id)initWithName:(NSString*)nameValue age:(int)ageValue {
  // 1
  if(!nameValue || ageValue > 120) {
    return nil;
  }

  // 2
  self = [super init];
  if(!self) {
    return nil;
  }

  // 3
  self.name = [[NSString alloc]initWithString:nameValue];
  if(!self.name) {
    self = nil;
    return nil;
  }
  self.age = ageValue;
}
```

## 协议和代理

协议有约束作用，只声明不实现，类似抽象类

<!--more-->

```objective-c
// nameDelegate.h
#import <Foundation/Foundation.h>

// 声明
@protocol nameDelegate<NSObject>

// 必须实现
@required

- (void) say();

// 可选
@optional

// ...

@end
```

定义两个类文件

```objective-c
// Animal.h
#import <Foundation/Foundation.h>
#import "nameDelegate.h"
@interface Person : NSObject<nameDelegate>

@property(nonatomic, assign) id<nameDelegate> delegate;

- (void)sayNyan {
  NGLog(@"喵喵喵");
  // 通知人类我喵喵喵了
  [self.delegate say];
}

@end

// Person.h
#import <Foundation/Foundation.h>
#import "nameDelegate.h"

@class Animal

@interface Person : NSObject<nameDelegate>

@property(nonatomic, strong) Animal *nyanko

@end

// Person.m
import "Person.h"

@implementation Person

- (id)init {
  self = [super init];
  if(!self) {
    return nil;
  }

  self.nyanko = [[Animal alloc] init];
  if(!self.nyako) {
    self = nil;
    return nil;
  }

  // 代理 ？？？
  self.nyanko.delegate = self;
  return self;
}

// 实现协议
- (void)say {
  NGLog(@"它喵喵喵了");
}

@end
```

使用

```objective-c
// main.m
#import <Foundation/Foundation.h>
#import "Person.h"
#import "Animal.h"

int main(int argc, const char * argv[]) {
  @autoreleasepool {
    // 造猫
    Person * cat = [[Person alloc] init];
    // 让她叫
    [p.nyanko sayNyan];
  }
}
```
