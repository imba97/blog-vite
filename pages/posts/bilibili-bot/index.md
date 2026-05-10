---
id: 742
title: 程序猿复健计划之B站机器人
date: 2021-05-19 23:20:59
tags:
  - B站
  - 机器人
  - bilibili
categories:
  - 个人项目
---

# 功能

1. 梗百科，查询梗的意思

   <img src="/uploads/2021/05/bili-bot-1.jpg" style="zoom:50%;" />

---

2. 以图搜番，跟微信的区别是，它最后会发送动图，因为不能发视频

   <img src="/uploads/2021/05/bili-bot-2.jpg" style="zoom:50%;" />

---

你可以使用宝塔Docker管理器轻松配置开启

<!--more-->

# 教程

1. 搜索镜像：imba97/bili-bot:1.0.0

   ![](/uploads/2021/07/bili-bot-3.png)

2. 创建容器

   ![](/uploads/2021/07/bili-bot-4.png)

3. 选择镜像，点提交

   ![](/uploads/2021/07/bili-bot-5.png)

4. 点击日志获取登录二维码

   ![](/uploads/2021/07/bili-bot-6.png)

5. 扫码登录（登录后这个页面不会有提示，用的Wechaty的二维码生成页）

   ![](/uploads/2021/07/bili-bot-7.png)

6. 重新打开日志会提示登陆成功

   ![](/uploads/2021/07/bili-bot-8.png)

以上

---

如果不想用docker，也可以下载源码直接拿Node.js跑

但你还需要手动在电脑上装个`ffmpeg`，以图搜番会用它把视频转成gif

[Github](https://github.com/imba97/imba97_project/tree/master/bili_bot)
