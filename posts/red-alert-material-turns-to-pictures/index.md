---
id: 651
title: 红色警戒素材转图片
date: 2020-06-24 11:04:30
tags:
  - 红色警戒
categories:
  - 瞎研究
---

# 导出素材

软件：**XCCMixer**，用它打开`红警目录/ra2.mix`

常用素材目录（也不一定都是）

<!--more-->

`conquer.mix` 特效（如核弹爆炸、超时空转换）、活的（有男滴有女滴还有尼玛小动物）
`isogen.mix` 战役建筑
`isosnow.mix` 战役建筑（五角大楼）、中立建筑（楼房、路标、旗子）、游戏建筑的建造动画

双击素材预览，提示：可以用键盘操作，**上下键**选择素材，**回车键**预览，**ESC键**关闭预览，**退格键**返回上层菜单

找到合适的素材后按右键，选择“**释放**”，会导出一个`.shp`的文件

# 转图片

软件：**SHP-Builder**，打开`.shp`文件

选择`File` => `Export` => `SHP -> Images`

![](/uploads/2020/06/ra2-1.png)

起个名字，点保存，会弹出这样一个框

![](/uploads/2020/06/ra2-2.png)

**Loop Type 动画循环类型**

- No Loop 不循环
- Loop Continusly 循环

**Shadows 阴影**

- All 全部
- None 无
- Merge info frames 合并

**Transparency 透明**

- Use transparency 使用透明

**Zoom 缩放**

# 颜色问题

有些时候颜色是会出问题的，常见是特效部分，比如下面这个核爆素材

![](/uploads/2021/04/fe2d0001e0beb1837d45.gif)

解决方法是调整配色方案

`Palette` => `Red Alert 2`，红警的话选这个

![](/uploads/2020/06/ra2-3.png)

里面名字如果能对应你这个素材的目录，那就选名字对应的，如果没有可以随便试试

于是就正常了

![](/uploads/2021/04/fe48000200f514d7ecf1.gif)

第一张图导出选项中 **Shadows** 是 `Merge info frames`
第二张是 `None`

也很明显能看出动画的区别
