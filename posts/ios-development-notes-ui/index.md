---
id: 496
title: iOS 开发笔记 - UI
date: 2020-02-20 21:55:02
tags: []
categories:
  - 笔记
---

## UI控件关联代码（Objective-C）

```objective-c
// ViewController
#import "ViewController.h"

// 扩展类
@interface ViewController ()
// (IBAction)是返回值，等于void，但如果想关联UI控件的执行动作，就必须设置为(IBAction)
- (IBAction) test;
@end

@implementation ViewController
// 实现
- (void) test {
  NSLog(@"test");
}
@end
```

<!--more-->

## IBAction、IBOutlet

`IBAction`从返回值角度看，作用相当于void，只有返回值声明`IBAction`的方法，才能跟`storyboard`中的控件连线
`IBOutlet`是属性，只有声明`IBOutlet`的属性才能跟`storyboard`中的控件连线

多控件关联同一个方法只需拖到同一个`IBAction`上即可

## 获取当前控件

```objective-c
- (IBAction) test:(UIButton *) sender {
  // 此时 serder 就是触发事件的按钮
  // 打印tag
  NSLog(sender.tag);
}
```

## 获取父控件和子控件

```objective-c
// superview 获取父控件
self.textTest.superview.backgroundColor = [UIColor redColor];
// subviews 获取所有子控件
for (UIView *view in self.view.subviews) {
  view.backgroundColor = [UIColor redColor];
}
```

## 根据tag获取控件

首先需要在 storyboard 设置控件的 tag

```objective-c
// 比如获取某个文本框
UITextField *txt = (UITextField *) [elf.view viewWithTag: 1000];
```

## 移动位置

```objective-c
// 1. 获取控件 center 或 frame，center是中心点坐标，frame是左上角坐标
CGPoint centerPoint = self.btnTest.center;
// 2. 修改
centerPoint.x -=10;
centerPoint.y +=10;
// 3. 重新赋值 center
self.btnTest.center = centerPoint;
```

## 动画效果

```objective-c
// 1. 开启动画
[UIView beginAnimations: nil context:nil];
// 2. 设置动画执行时间
[UIView setAnimationDuration:2];

// 要执行动画的代码，比如设置位置
self.btnTest.center = centerPoint;

// 3. 提交动画
[UIView commitAnimations];
```

block 方式执行动画

```objective-c
[UIView animateWithDuration:1 animations:^{
  // 要执行动画的代码
  self.btnTest.center = centerPoint;
}];
```

## 加载图片

使用`imageNamed:`方法可以让图片缓存在内存中，直到应用退出

```objective-c
UIImage *img = [UIImage imageNamed:@"test"];
```

使用`imageWithContentsOfFile:`方法则不会有缓存

```objective-c
NSString *path = [[NSBundle mainBundle] pathForResource:@"test.jpg" ofType:nil];
UIImage *img = [UIImage imageWithContentsOfFile:path];
```

## Swift创建、销毁视图

```swift
import UIKit
class DemoViewController: UIViewController {
  override func viewDidLoad() {
    super.viewDidLoad()
    // 视图最好指定背景颜色
    view.backgroundColor = UIColor.whiteColor()
  }
}
// 创建视图
func open() {
  let vc = DemoViewController()
  presentViewController(vc, animated: true, completion: nil)
}
// 销毁视图
func close() {
  dismissViewControllerAnimated(true, completion: nil)
}
```
