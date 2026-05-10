---
id: 761
title: Bitwarden 登录失败问题记录
date: 2023-03-12 21:50:51
tags:
  - bitwarden
categories:
  - 瞎研究
---

# 错误

Bitwarden 是一个密码管理工具，服务端支持自己部署，所以用 `Docker` 搭了一个，稳定运行了一年多

直到几个月前，突然出现了问题，所有客户端（浏览器插件、手机 app）都不能登录了

<img src="/uploads/2023/03/bitwarden-login-error-1.png" style="zoom:50%;" />

不过服务端自带的 Web 界面还能用，再加上懒就一直没折腾，但确实也挺困扰的，总不能一直登 Web 界面获取密码

于是今天想着解决解决

# 原因

像这种所有客户端同时报错的情况，理所应当就会想到肯定是服务端更新了什么

搜了一下问题，发现 [贴吧](https://tieba.baidu.com/p/8195973485) 有讨论，果然官方早就发布过 [《11月弃用通知》](https://bitwarden.com/help/november-deprecation-notice/)

# 解决

像我这种怕麻烦的人，换浏览器插件版本这种解决方案我是直接放弃的，因为多台设备换一遍也是挺麻烦的

也是同篇帖子提到把镜像换成 `vaultwarden/server`，于是我选择按这个方案进行

首先肯定要把原来的密码**全部导出**，然后再

因为我是用了宝塔，所以直接打开 `Docker` 管理器，拉取镜像，创建容器

<img src="/uploads/2023/03/bitwarden-login-error-2.png" style="zoom:50%;" />

按以上配置，其中 `WEBSOCKET_ENABLED=true` 是 [WebSocket 通知端口](https://github.com/dani-garcia/vaultwarden/blob/a13a5bd1d8c3fea3fce80eba6e8c3aa8880855dd/.env.template#L68)，不需要的可以不加，并且也不需要映射 `3012` 端口

目录映射一般写网站根目录，毕竟反向代理后闲着也是闲着

`80` 端口如果跟之前一样，反向代理就不用改，直接保存即可
