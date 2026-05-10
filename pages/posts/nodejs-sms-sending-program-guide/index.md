---
id: 765
title: Nodejs 发送短信程序避坑指南
date: 2023-07-21 22:40:39
tags:
  - Nodejs
  - serialport
  - AT
  - 串口
categories:
  - 瞎研究
---

# 前面的废话

前阵子接了个有意思的活，需求根据模板批量发送短信，在强烈兴趣爱好的驱使下决定研究研究，顺便把钱赚了

找教程的时候发现非常少，视频资源都比较老，中英文短信混合发送没有一个教程提及，调通硬件又发现，`nodejs` 相关的资源就更少了

<!--more-->

折腾了两周多，最开始买的板子只支持 `2G`，想着办 `2G` 卡结果营业厅说没法办，一通找最后又换成现在这个板子，还有发短信各种失败...

总之最后折腾出来这篇，分享一下踩的坑

# 硬件准备

- 封装好的 4G 模块 **(A7680C)**

  <img src="/uploads/2023/07/serialport-1-1.jpg" style="zoom:50%;" />

- USB TO TTL **(CH340G)** 一般会附赠线

  <img src="/uploads/2023/07/serialport-1-2.jpg" style="zoom:50%;" />

# 接线参考

<img src="/uploads/2023/07/serialport-1-3.jpg" style="zoom:50%;" />

# 测试

用串口工具，或者使用 `serialport` 包写个简单的程序连接并发送指令

但注意甄别，我遇到有些工具不会按你的指令，会给你发一些乱七八糟的短信

## 发送英文短信

- `AT` 测试命令

- `AT+CMGF=1` 设置短信格式

- `AT+CMGS=13000000000` 接收手机

  以上都需要发送新行，也就是回车

- `>` 出现箭头后写上短信内容，去掉发送新行并发送

- 切换到 `16进制` 新行发送 `1A`

有的教程说的最后发送 `Ctrl + Z` 其实说的就是 `1A`

![](/uploads/2023/07/serialport-1-4.jpg)

接收成功的短信

<img src="/uploads/2023/07/serialport-1-5.jpg" style="zoom: 33%;" />

## 发送中文短信

首先要将手机号、短信内容经过一系列处理

- `801986` + 发送人手机号 + `F`，进行奇偶反转，如 `80198613012345678F` 变为 `0891683110325476F8`
- `86` + 收件人手机号 + `F`，进行奇偶反转
- 短信内容转为 16 进制
- `11000D91` + 收件人反转的手机号 + `0008AA` + 16 进制短信内容
- 计算上一步字符串长度除以二
- 发件人反转手机号 + 第四步的字符串
- 依次执行 `AT+CMGF=0`、`AT+CSCS="GSM`、`AT+CMGS=字符串长度`、上一步的字符串、`1A`

# 避坑

1. 中文短信转 16 进制要 4 位，不足补零，比如 `ABC` 是不行的，必须是 `0ABC`，否则会乱码

2. 在 `nodejs` 里 `1A` 的发送方式是

   ```javascript
   serialPort.write(Buffer.from([0x1A]))
   serialPort.write('\r')
   ```

# 参考

- [中文短信编码流程](https://github.com/imba97/simple-serialport-gsm/blob/master/packages/adapters/src/MainlandChinaAdapter.ts)
- [短信内容转 16 进制](https://github.com/imba97/simple-serialport-gsm/blob/master/packages/utils/src/unicode.ts)
