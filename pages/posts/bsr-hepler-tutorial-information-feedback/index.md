---
id: 748
title: bsr-hepler 使用教程 - 信息回传
date: 2021-11-15 21:35:00
tags:
  - bsr-helper
categories:
  - 教程
---

# 简介

`bsr-hepler`是一些小工具，帮助蓝天队员快速完成一些日常在手机上的操作

目前只有一个功能：**信息回传**

<!--more-->

# 使用

在工具主页：[https://bsr.imba97.cn](https://bsr.imba97.cn)

可以看到这唯一的一个功能

![](/uploads/2021/11/bsr-helper-information-return-1.png)

点击进入该功能，可以看到这样一个页面（默认是全部展开的，这里演示我手动收起了）

![](/uploads/2021/11/bsr-helper-information-return-2.png)

最上面是**出发**、**到家**的选项，不同选项生成的信息回传文本会有所区别

右侧的**复制**点击可快速复制文本

# 设置项

如果什么都不设置，这段话看起来怪怪的，所以你需要设置每一项的内容

这些设置会在你点击复制按钮时**保存**，所以大部分只需要设置一次即可

## 任务简介

可以设置任务简介，比如：“马拉松安保训练”

![](/uploads/2021/11/bsr-helper-information-return-3.png)

## 时间

可以设置使用当前时间、设置开始时间和结束时间

![](/uploads/2021/11/bsr-helper-information-return-4.png)

如果你需要自选时间，请关闭使用当前时间开关

关闭后可自选时间

![](/uploads/2021/11/bsr-helper-information-return-5.gif)

自定义时间时，可以选择结束时间，一般用于到家的消息回传，会显示一个时间段

![](/uploads/2021/11/bsr-helper-information-return-6.png)

## 出发地、目的地

可以设置地点，点击复制按钮后，本次设置的地点会保存在**历史地点**

![](/uploads/2021/11/bsr-helper-information-return-7.png)

## 人员

可以添加人员、设置姓名、**左滑删除**

![](/uploads/2021/11/bsr-helper-information-return-8.png)

程序将根据打勾的人**自动生成人数**，无需手动输入

## 交通工具

可以选择交通工具、设置车牌号、设置自定义交通工具

![](/uploads/2021/11/bsr-helper-information-return-9.png)

如果设置为“**开车**”，那么**人员设置**会与交通工具联动

此时**人员**中**第一个打勾的人**是驾驶员，会出现**驾驶员标识**

可以拖拽排序

![](/uploads/2021/11/bsr-helper-information-return-10.gif)

程序会根据**勾选**、**排序**自动设置消息回传中人员的显示、排序

## 专业工具

可以选择专业工具、搜索专业工具、添加自定义专业工具

![](/uploads/2021/11/bsr-helper-information-return-11.png)

目前专业工具只是演示性的加了这四个，如果想**添加**，可以在搜索中输入，搜索内容不存在时会出现**添加按钮**

![](/uploads/2021/11/bsr-helper-information-return-12.png)

更多专业工具会慢慢完善

# 其他

其他的功能及注意点

## 自动切换出发、到家

当你出发时复制了一次**出发**的消息回传后，下次再打开这个页面，会自动切换到**到家**，并且自动填写**起始时间**和**结束时间**，自动切换**出发地**、**目的地**

## 时间优化

起始时间、结束时间做了一点优化，相同年时不显示年、同月不显示月、同日不显示日

## 本地存储

所有数据都是存在浏览器中，如果更换了浏览器或手机再打开页面，则需要重新设置

之后会考虑做**导出设置项**、**导入设置项**

# 开源

本程序使用`Vue2`+`Vant`+`TypeScript`开发

欢迎蓝天的程序员大佬们一起开发各种小工具

[项目地址](https://github.com/bsr-project/bsr-helper)
