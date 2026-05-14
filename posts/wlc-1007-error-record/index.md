---
id: 763
title: 网络游戏防沉迷实名认证系统 1007 错误记录
date: 2023-04-12 23:49:41
tags:
  - 实名认证
categories:
  - 瞎研究
---

# 前言

最近在接 [网络游戏防沉迷实名认证系统](https://wlc.nppa.gov.cn/fcm_company/index.html)，它得要你跑通所有测试接口才给你用正式接口

所以我直接投降，用了个开源包，[chinawilon/fcm_game](https://github.com/chinawilon/fcm_game)

奈何是 `composer` 的，现学现卖终于跑起来了，但这才是刚开始

# 直奔主题

遇到了个报错怎么调也调不通，接口返回报错内容

```json
{"errcode":1007,"errmsg":"SYS REQ EXPIRE ERROR"}
```

根据文档说明是：接口请求过期

最开始没仔细想，以为是参数问题，就把各种参数打印了个遍，发现没啥问题

后面仔细一想，**过期** 那不就是时间的问题吗

# 调试

使用命令打印服务器日期

```bash
date "+%Y-%m-%d %H:%M:%S"
```

发现果然罪魁祸首就是服务器日期慢了几分钟！

# 解决

使用 `ntp`、`ntpdate` 让服务器自己去时间同步服务器同步时间

首先安装这两个软件

```bash
yum -y install ntp ntpdate
```

设置同步服务器

```bash
ntpdate time.windows.com
```

它输出的内容会告诉你慢了或者快了多少

```
[root@localhost auth]# ntpdate time.windows.com
12 Apr 23:31:48 ntpdate[45077]: adjust time server 52.231.114.183 offset 195.562017 sec
```

愉快解决

再去解决下一个问题了，告辞
