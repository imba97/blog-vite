---
id: 750
title: 留下了遗憾的 2021
date: 2021-12-31 23:59:59
tags:
  - 2021
  - 总结
categories:
  - 年度总结
---

又到了写年度总结的时间了，2021年状态依然

> 间歇性踌躇满志，持续性混吃等死。

<!--more-->

# 生活

年初做了近视手术，因为打算下半年当兵，4月从巴中回到了山东（但是既然你能看到这篇文章，说明我没去成，原因下面会说）

回家后不久把我的串串（猫）也托运回来了，目前丢给我妈养了

上半年跟着朋友健身，健身一段时间后无意间一摸肱二头肌，给我自己吓到了，粗了一圈

不过下半年又回归了咸鱼状态，肌肉就又没了

虽然说去年说了“越来越想把台式机换成笔记本了”，但还是真香了，入手了`HUAWEI Mate Station S`

不过也入手了一台笔记本，用来玩VR游戏的，VR 设备是华为`VR Glass 6DoF`

# 遗憾

本年度最大的遗憾就是当兵没去成，原因是刚刚刚刚好下半年[征兵年龄修改](https://xw.qq.com/amphtml/20210713A0B99Y00)

本来是通过了，武装部的短信都来了

<img src="/uploads/2021/12/report-2021-1.jpg" style="zoom:50%;" />

6月份的某天我一看征兵网，发现年龄不合格了

非常的巧，今年下半年开始，征兵年龄修改为全日制18-24，非全日制18-22，我刚好是非全日制

# 工作

其实在打算当兵时我就做好了没去成的准备，没去成就继续当我的程序猿

7月来到杭州开始找工作，当时方向是`PHP`和`web前端`，更偏向`web前端`，但我没`web前端`的实际工作经验，只有一些个人项目

面试的时候我甚至连`Vue`的生命周期都背不出来，不过好在有点基础，不会的现学也挺快

跟朋友开发的游戏因为近视手术暂时搁置，之后朋友也工作了，就彻底停了，以后应该还会继续

# 程序

今年跟**上传**功能干上了，写了好多上传相关的东西

1. **两个 Picgo 插件**

   写博客的时候想把图片上传到自己服务器上，但发现没有我想要的插件，于是被迫自己做了

   [picgo-plugin-ftp-uploader](https://github.com/imba97/picgo-plugin-ftp-uploader) FTP 上传

   [picgo-plugin-sftp-uploader](https://github.com/imba97/picgo-plugin-sftp-uploader) SFTP 上传

   ![](/uploads/2021/12/report-2021-2.jpg)

   ---

2. **前端项目部署工具**

   可以快速把打包后的前端项目部署到服务器的工具，也是 SFTP 上传

   可单独使用，可作为`webpack`插件使用，也可以单纯作为上传工具用

   ![](/uploads/2021/12/report-2021-3.jpg)

   Github：[simple-sftp-uploader](https://github.com/imba97/simple-sftp-uploader)

   Npm：[simple-sftp-uploader](https://npmjs.com/simple-sftp-uploader)

   ---

3. **iconfont 样式生成工具**

   根据 [iconfont](https://iconfont.cn) 的项目样式链接，将字体转`Base64`、样式压缩后生成`css`文件到指定目录

   Github：[simple-iconfont-builder](https://github.com/imba97/simple-iconfont-builder)

   Npm：[simple-iconfont-builder](https://npmjs.com/simple-iconfont-builder)

   ---

4. **重构 Btools 浏览器插件**

   Btools 浏览器插件的重构版本，这个虽然2020年5月就打算动工，但一直懒迟迟没做

   今年打算找前端工作了，想着得有个像样的项目，所以光速重构并发布了

   还砍了原来版本的一些功能，反向更新最为致命（但周用户数居然破2w了，惊了）

   Github：[Btools-vue](https://github.com/imba97/Btools-vue)

   ---

5. **bsr-helper**

   蓝天救援队助手，使用`Vue`+`TypeScript`+`Vant UI`做的面向移动端设备的网页应用

   蓝天队员每次参加活动或者结束后回家，都需要在群里发一个“消息回传”，大致是把时间、人员、交通手段、出发地、目的地等信息汇总发过去

   每次手打或者复制别人的再改感觉比较麻烦，所以就做了一个可以通过简单设置、点选后自动生成信息回传内容的小工具

   Github：[bsr-helper](https://github.com/bsr-project/bsr-helper)

   ---

6. **微信机器人**

   [《程序猿复健计划之微信机器人》](/archives/741/) 又名：《如何跟微信好友对线时轻松取胜》

   Github：[wechat_bot](https://github.com/imba97/imba97_project/tree/master/wechat_bot)

   ---

7. **~~B站机器人~~（已废弃）**

   B站改了接口，目前不能用了

   [《程序猿复健计划之B站机器人》](/archives/742/)

   Github：[bili_bot](https://github.com/imba97/imba97_project/tree/master/bili_bot)

   Docker：[bili-bot](https://hub.docker.com/r/imba97/bili-bot/tags)

   ---

8. **索尼中国自动签到**

   每天 `00:00:05` 这个时间点在 [索尼中国官网](https://www.sonystyle.com.cn/) 和 [My Sony 社区](https://www.sonystyle.com.cn/mysony/bbs/web/) 自动签到

   ![](/uploads/2021/12/report-2021-4.png)

   Github：[sonystyle-auto-sign-in](https://github.com/imba97/imba97_project/tree/master/sonystyle-auto-sign-in)

   ---

9. **表格生成器**

   给朋友写的表格统计器，朋友的工作是负责旅游用车的调度，每月要统计汇总，需要在个有**40多个工作簿**的表格中，每个工作簿是一辆车的信息，记录着用车天数、里程、加油升数、加油的钱、乘客人数等等，把所有的数据加起来汇总成一张表格。并且这样的表格有两个，手动统计非常麻烦。这个工具可以把朋友的摸鱼时间直接拉满，每个表格直接拖进去不到1秒就能自动生成汇总表格

   后来用这个，给我姨做了一个类似的，她是大学老师，需要统计自己班学生的成绩，涉及到两张表，**全校学生表**和**班级学生表**。统计方式是在全校学生表中，根据学号找到并复制学生成绩，粘贴到班级学生表对应的学生成绩一栏。使用工具只需要把两个表分别拖到指定区域，点击生成即可

   也是想通过做项目的方式研究一下`electron`，体验一下前端语言开发桌面应用

   Github：[electron-excel-generator](https://github.com/imba97/electron-excel-generator)

   ---

10. **electron-vue 事件监听广播系统**

    基于`electron`主进程和渲染进程的交互逻辑

    主要功能是统一以下消息传递

    - 主进程到渲染进程
    - 渲染进程到主进程
    - 渲染进程到渲染进程
    - 渲染进程中`Vue`组件之间

    Github：[electron-vue-event-manager](https://github.com/imba97/electron-vue-event-manager)

    Npm：[electron-vue-event-manager](https://www.npmjs.com/package/electron-vue-event-manager)

    ---

11. **钉钉日报助手**

    每天提交日报多少有点麻烦，之前我是每天去看`git`的提交记录，一条条复制粘贴到日报里。但这完全能用程序解决，这个程序就是可以在**指定时间**，去一个或多个**指定项目目录**下拉取`git log`，从中取出**指定用户**提交的信息，没有则会过滤，并可以**指定前缀**，只有带这个前缀的才会被抓取，最后自动发送到钉钉群

    ![](/uploads/2021/12/report-2021-5.png)

    比如我设置的，每天`18:00`拉取4个项目的日志，用户是`imba97`，前缀是`report: `

    使用`pm2`让这个程序开机启动，所以只要我在公司，开了机，这个程序就会启动，到点就会整理我今天的日志

---

这一年对`node.js`这套东西有了更深的认识，自己也发了几个`npm`包，虽然都是些小玩意儿，但也算是从`import`迈向了`export`的第一步

还有是赞美开源，可以这么说，如果没有开源社区，单靠我一个人的力量，这里面任何一个项目都完不成

# 博客

加入了“[开往](https://github.com/volfclub/travellings/issues/748)”

加入了“[十年之约](https://www.foreverblog.cn/blog/2491.html)”

# 2022 Flag

1. 拿下日语 JLPT N1，目标分数**150**！
2. 系统学习数据结构和设计模式
