---
id: 371
title: 树莓派折腾笔记
date: 2019-08-10 13:45:58
tags:
  - 树莓派
categories:
  - 瞎研究
---

## 解锁root

```bash
sudo passwd root
sudo passwd --unlock root
# 可能会提示 password expiry information changed
# 需要配置ssh，允许root用户登录
sudo nano /etc/ssh/sshd_config
# Ctrl + W 搜索 PermitRootLogin without-password 取消注释并改为
PermitRootLogin yes
```

<!--more-->

重启后就可以用root登录了，之后的操作我都是在root下，如果你没用root，自行加上`sudo`

## 切换国内软件源

参考 [[1]]

版本对应表 [[2]]

版本号 | 对应代号
-     |     -
6.0   |   squeeze
7.0   |   wheezy
8.0   |   jessie
9.0   |   stretch
10.0  |   buster
11.0？|   bullseye

```bash
# 首先查看版本
cat /etc/debian_version

# 备份配置
cp /etc/apt/sources.list /etc/apt/sources.list.bak

# 修改 sources.list
nano /etc/apt/sources.list
```

删除原有内容，配置国内的，这里以中国科学技术大学的软件源为例
版本号不同，配置也不同，我的版本号是 10.0 所以是 buster

```bash
deb http://mirrors.ustc.edu.cn/raspbian/raspbian/ buster main contrib non-free
deb-src http://mirrors.ustc.edu.cn/raspbian/raspbian/ buster main contrib non-free
```

保存退出，然后更新一下列表和软件

```bash
apt-get update
apt-get upgrade
```

[1]: https://www.cnblogs.com/mq0036/p/8893733.html
[2]: https://www.debian.org/releases/
