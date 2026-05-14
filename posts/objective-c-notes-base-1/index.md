---
id: 310
title: Objective-C 笔记 – 02
date: 2019-08-07 18:43:24
tags:
  - Objective-C
categories:
  - 笔记
---

## 函数

```objective-c
// main.m
#import <Foundation/Foundation.h>

// C风格函数
int sumFunc(int a, int b) {
  return a + b;
}

int main(int argc, const char * argv[]) {
  @autoreleasepool {
    int sum = sumFunc(1, 2);
    NGLog(@"sum = %d", sum);
  }
  return 0;
}
```

<!--more-->

## 指针 和 block

常用于多线程、异步任务、集合遍历、集合排序、动画转场

```objective-c
// main.m

void test() {
  printf("喵喵喵");
}

int sum(a, b) {
  return a + b;
}

// 定义指针
void (*p)();

// 定义block
typedef int (^b)(int, int);

int main(int argc, const char * argv[]) {
  @autoreleasepool {
    // 指向test
    p = test;
    // 调用
    (*p)(); // = test(); = p();

    // block也可以调用函数
    b = sum;
    b(1, 2);

    // 直接定义函数
    void(^myBlock)() = ^{
      NSLog(@"这是个block");
    }

    // 带参数
    void(^myBlock2)() = ^(int a, int b) {
      return a + b;
    }
  }
}
```

## 结构体 和 指针

```objective-c
// main.m
@autoreleasepool {
  // 定义结构体
  struct point {
    int x;
    int y;

    // 指针
    struct point * nextP;
  }
  // 创建
  struct point p;
  // 赋值
  p.x = 10;
  p.y = 10;

  // 第二个结构体
  struct circle {
    // 可以包含其他结构体
    struct point pp;
    // 定义本结构体的变量
    int radius;
  }

  struct circle c;

  c.pp = p;
  c.radius = 50;

  // 定义结构体也可以使用
  typedef struct _student {
    char name;
    int age;
  } student;
  // 调用
  student a;
  a.name = "喵喵喵";
  a.age = 20;

  // 使用指针
  struct point * tmpPoint;
  // 指向p的地址
  tmpPoint = &p;

  tmpPoint->x = 10;
  tmpPoint->y = 10;

  // 使用内部定义的指针指向pointB的地址
  struct point pointB;
  pointB.x = 233;
  pointB.y = 233;
  p.nextP = &pointB;
}
```
