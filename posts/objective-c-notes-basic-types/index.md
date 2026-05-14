---
id: 299
title: Objective-C 笔记 - 基本类型
date: 2019-08-06 17:03:44
tags:
  - 数据类型
  - Objective-C
categories:
  - 笔记
---

## 数据类型

- 数组

存储指向对象的指针

定义一维数组

```objective-c
int core[10];
for(int i = 0; i < 100; i++) {
  NSLog(@"core[%d] = %d", i, core[i]);
}
// 没有初始化之前 里面是垃圾值
```

<!--more-->

定义二维数组

```objective-c
int core2[3][5];
for(int i = 0; i < 3; i++) {
  for(int j = 0; j < 5; j++) {
    core2[i][j] = i + j;
    NSLog(@"core2[%d][%d] = %d", i, j, core[i][j]);
  }
}
```

## 枚举

C语言定义枚举类型，枚举的数据类型不确定，会默认使用`int`
iOS 6.0 之后推出两个宏
- NS_ENUM 可以指定数据类型
- NS_OPTION 可以使用位移，用位或来设置数值

## #define

宏定义（全局变量）
一般用于定义全局、值不变的内容

```objective-c
#define COLOR 0xffffff
#define IMAGE_PATH @"image.png"
#define iPhone5 ([UIScreen instancesRespondToSelector:@selector(currentMode)] ? CGSizeEqualToSize(CGSizeMake(640, 1136), [[UIScreen mainScreen] currentMode].size) : NO)
```

## #import

包含预警功能，已经包含过的文件不会再次包含。

```objective-c
// 尖括号是从系统指定目录下查找
#import <Foundation/Foundation.h>
// 引号是从用户目录下查找
#import "Person.h"
```
