---
id: 808
title: 组了个 QNAS MINI
date: 2025-10-14 22:17:38
tags:
  - NAS
  - 飞牛
categories:
  - 瞎研究
---

# QNAS MINI

QNAS MINI 是一个 2.5 寸 6 盘位 <span i-material-symbols-hard-disk-rounded bg-gray></span> NAS，拼好后就是下图

![](https://imba97.com/uploads/2025/10/qnasmini-1.png)

（下半部分，上面是个 UPS）

硬件如下

- 3D 打印外壳（海鲜市场）
- QNAS MINI 背板及线材螺丝（海鲜市场）
- 畅网微控 N355 主板
- Crucial DDR5 4800MHz 32G 内存条
- M.2 转 6 SATA ASM1166 扩展卡
- 致钛 500G + 2TB SSD

# 软件

系统安装了飞牛，一直想试试，真好用

主要是相册和影音，相册支持 AI 人脸识别和以文搜图搜视频，影音相当于 Jellyfin + 信息刮削 + 字幕下载，还自带一个 `FN Connect`，可以远程访问到 NAS，免费的完全够用

除此之外，我又单独跑了一个 `Cloudflare Tunnel` 做内网穿透，`Docker` 跑起来，配置简单，作为一个备份。也确实遇到过一次官方远程连不上的问题

之前用的 `NPS`，需要自己搭建服务器，作者也不更新了，所以刚好也是顺便换掉

# 拼装踩坑总结

出了一个视频 <span i-ix-bilibili-logo bg="#fb7299"></span> [BV1H34UzWEwJ](http://b23.tv/BV1H34UzWEwJ)，可以参考一下，以下是文字总结

1. 主板上螺丝是，有一侧螺丝不好拧，可以使用束线带绑住螺丝伸进去拧
2. 主板安装后可以先接一下 SATA 线，是有正反的
3. 侧面有方形孔，可以用来扎线，如果引导盘用硬盘，注意别压到内存
4. 风扇供电线有正反，不要接反了

# 网络拓扑图

更新了一下网络拓扑图

![](https://imba97.com/uploads/2025/10/qnasmini-2.png)

后续逐步把 All in One 的 NAS 迁移到 QNAS MINI 上，以及安排上 6 盘位
