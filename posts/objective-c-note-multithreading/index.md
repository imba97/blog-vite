---
id: 387
title: Objective-C 笔记 – 多线程
date: 2019-08-13 14:17:27
tags:
  - 互斥锁
  - 多线程
  - Objective-C
categories:
  - 笔记
---

## 互斥锁

```objective-c

@property(nonatomic, assign) init tickets;

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event {
  self.tickets = 20;

  NSThread * t1 = [[NSThread alloc] initWithTarget:self selector:@selector(saleTickets) object:nil];
  [t1 start];

  NSThread * t2 = [[NSThread alloc] initWithTarget:self selector:@selector(saleTickets) object:nil];
  [t2 start];
}

- (void)saleTickets {
  while(YES) {
    [NSThread sleepForTimeInterval: 1.0];
    // 互斥锁可以让锁内代码同一时间只被一条线程运行
    @synchronized(self) {
      if(self.tickets > 0) {
        self.tickets--;
        NSLog(@"剩下%d张票", self.tickets);
      } else {
        NSLog(@"卖完了");
        break;
      }
    }
  }
}
```

<!--more-->

## 自旋锁

原子属性内部的锁

```objective-c
@property(atomic, assign) init tickets;
```

## 相同点与不同的

相同点

- 消耗性能、效率不高
- 能够保证线程安全

不同点

- **自旋锁**读取时不会锁
- 线程被**互斥锁**锁在外面，线程会进入休眠状态，等待锁打开后被唤醒
- 线程被**自旋锁**锁在外面，线程会进入死循环状态等待开锁

## RunLoop

主线程默认开启RunLoop，子线程默认关闭，需要手动开启

```objective-c
@interface ViewController()
@property(assign, nonatomic, getter=isFinished)BOOL finished
@end

- (void)viewDidLoad {
  [super viewDidLoad];

  // 先执行demo
  NSThread * t1 = [[NSThread alloc] initWithTarget:self selector:@selector(demo) object:nil];
  [t1 start];

  self.finished = NO;

  // 然后执行otherMethod
  // 如果不设置t1的RunLoop，执行完demo是不会执行otherMethod的
  [self performSelector:@selector(otherMethod) onThread:t1 withObject:nil waitUntilDone:NO];
}

- (void)demo {
  NSLog(@"before");
  while(!self.isFinished) {
    // 开启RunLoop查询当前线程有没有事件
    [[NsRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.1]];
  NSLog(@"after");
}

}

- (void)otherMethod {
  NSLog(@"otherMethod function");
  // 执行完第二个方法后设置为YES
  self.finished = YES;
}

// 另一种方式 一般不用 很难停下来
[[NSRunLoop currentRunLoop] run];
```

## RunLoopMode

- `NSDefaultRunLoop` 时钟、网络事件模式，操作UI界面会停止执行，执行会非常耗时
- `NSRunLoopCommonModes` 用户交互模式
