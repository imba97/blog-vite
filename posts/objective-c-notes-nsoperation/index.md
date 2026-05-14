---
id: 417
title: Objective-C 笔记 – NSOperation
date: 2019-08-19 15:51:20
tags:
  - NSOperation
  - Objective-C
categories:
  - 笔记
---

本质上是GCD的并发队列异步执行，是对GCD的面向对象的封装，是苹果大力推荐的并发技术

<!--more-->

与GCD的对比：

- GCD：
 - iOS 4.0 推出
 - 针对多核处理器做了优化的并发技术
 - 是C语言
 - 提供一次执行、延迟执行、调度组
 - 将**任务**添加到队列（串行、并发、主队列、全局队列），并且指定执行任务的函数（同步、异步）
- NSOperation：
 - iOS 2.0 推出
 - 底层是GCD
 - 面向对象
 - 提供最大并发线程、队列暂停继续、取消所有操作、指定操作之间的依赖关系
 - 将**操作**添加到队列（并发），然后立即异步执行

NSOperation 是一个抽象类，继承NSObject

- 特点：不能直接使用
- 目的：定义子类共有属性和方法
- 子类：
 - NSInvocationOperation
 - NSBlockOperation

```objective-c
- (void)demo1 {
  NSInvocationOperation * op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadImage:) object:@"invocation"];
  [op start];
}
- (void)downloadImage:(id)objc {
  NSLog(@"%@ %@", [NSThread currentThread, objc]);
}

- (void)viewDidLoad {
  [super viewDidLoad];
  [self demo1];
}
```

使用队列

```objective-c
- (void)demo1 {
  NSInvocationOperation * op = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(downloadImage:) object:@"invocation"];
  NSOperationQueue * q =[[NSOperationQueue alloc] init];
  // 添加到队列
  [q addOperation: op]
}
```

NSBlockOperation

```objective-c
- (void)demo3 {
  NSOperationQueue * q =[[NSOperationQueue alloc] init];
  NSBlockOperation * op = [NSBlockOperation blockOperationWithBlock: ^{
    NSLog(@"%@", [NSThread currentThread]);
  }]
}
```

更简单的写法

```objective-c
- (void)demo4 {
  NSOperationQueue * q =[[NSOperationQueue alloc] init];
  [q addOperationWithBlock: ^{
    NSLog(@"%@", [NSThread currentThread]);
  }]
}
```

使用全局队列

```objective-c
@interface ViewController()
// 先定义一个全局变量，然后用它指向一个队列
@property(nonacomic, strong) NSOperationQueue * opQueue;
@end

@implementation ViewController

// 懒加载
-(NSOperationQueue *)opQueue {
  if(!_opQueue) {
    _opQueue = [[NSOperationQueue alloc]init];
  }
  return _opQueue;
}

// 使用
- (void)demo5 {
  [self.opQueue addOperationWithBlock: ^{
    NSLog(@"%@", [NSThread currentNSThread]);
  }];

  // block operation
  NSBlockOperation * op1 = [NSBlockOperation blockOperationWithBlock: ^{
    NSLog(@"%@", [NSThread currentThread]);
  }];
  [self.opQueue addOperation: op1];

  // invocation operation
  NSInvocationOperation * op2 = [[NSInvocationOperation alloc]initWithTarget:self selector:@selector(downloadImage:) object:@"invocation"];
  [self.opQueue addOperation: op2];
}

@end
```

线程间的通讯，在子线程更新UI

```objective-c
- (void)demo6 {
  [self.opQueue addOperationWithBlock: ^{
    NSLog(@"耗时操作 %@", [NSThread currentThread]);
    // 主线程更新UI，首先拿到主线程
    [[NSOperationQueue mainQueue] AddOperationWithBlock: ^{
      NSLog(@"UI操作 %@", [NSThread currentThread]);
    }];
  }];
}
```

最大并发数，iOS 8.0 开始无论使用GCD还是NSOperation都会开启很多子线程，iOS 7.0 以前，GCD通常只会开启5~6条线程

一般情况下，WIFI网络设置5、6，流量网络设置2、3

```objective-c
- (void)demo7 {
  // 控制最大线程数量
  self.opQueue.maxConcurrentOperationCount = 2;
  for(int i = 0; i < 20; i++) {
    [self.opQueue addOperationWithBlock: ^{
      NSLog(@"%@", [NSThread currentThread]);
    }];
  }
}
```

暂停、继续

```objective-c
-(IBAction) pause {
  // 判断队列是否挂起（暂停）
  if(self.opQueue.isSuspended) {
    NSLog(@"继续");
    self.opQueue.suspended = NO;
  } else {
    NSLog(@"暂停");
    self.opQueue.suspended = YES;
  }
}
```

取消所有操作

```objective-c
- (IBAction) cancelAll {
  NSLog(@"取消所有操作");
  [self.opQueue cancelAllOperations];
}
```

依赖关系

```objective-c
- (void) dependecy {
  NSBlockOperation * op1 = [NSBlockOperation blockOperationWithBlock: ^{
    NSLog(@"动作 1 %@", [NSThread currentThread]);
  }];
  NSBlockOperation * op2 = [NSBlockOperation blockOperationWithBlock: ^{
    NSLog(@"动作 2 %@", [NSThread currentThread]);
  }];
  NSBlockOperation * op3 = [NSBlockOperation blockOperationWithBlock: ^{
    NSLog(@"动作 3 %@", [NSThread currentThread]);
  }];

  // NSOperation 的依赖关系，op2依赖于op1，op3依赖于op2
  [op2 addDependency: op1];
  [op3 addDependency: op2];

  // 添加到队列，waitUntilFinished是“是否等待”，会卡住当前线程
  [self.opQueue addOperations:@[op1, op2, op3] waitUntilFinished:YES];

  // 更新UI让主线程执行操作
  [[NSOperationQueue mainQueue] addOperation:op3];

  NSLog(@"运行至此");
}
```
