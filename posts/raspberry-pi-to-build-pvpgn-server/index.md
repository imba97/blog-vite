---
id: 436
title: 树莓派搭建PvPGN服务器
date: 2019-09-07 16:06:38
tags:
  - PvPGN
  - war3
  - 服务器
  - 魔兽争霸3
categories:
  - 瞎研究
---

## 简介

PvPGN 和 PvPGN PRO
PvPGN 全称：Player versus Player Gaming Network，是一款免费的开源跨平台服务器软件，支持Battle.net和Westwood Online游戏客户端
PvPGN在2011年停止维护，PvPGN PRO是PvPGN的一个分支版本，持续维护更新。

[详情查看Github项目](https://github.com/pvpgn/pvpgn-server)

<!--more-->

## 搭建

参考[官方教程](https://pvpgn.pro/pvpgn_installation.html)

首先下载编译 PvPGN 源代码所需的软件、工具

这里用的存储方式是mysql，所以下载了`libmysql++-dev`，你可以不下载mysql数据库，根据自己的需求来，甚至可以用文件存储的方式保存玩家信息等

其他存储：pgsql、sqlite3、odbc

```bash
sudo apt-get -y install build-essential clang libc++-dev git cmake zlib1g-dev liblua5.1-0-dev libmysql++-dev
```

这会下载一堆编译所需工具

然后下载 PvPGN 的源代码，找个目录执行命令下载并解压

```bash
wget https://github.com/pvpgn/pvpgn-server/archive/master.tar.gz
tar xf master.tar.gz
```

接下来是进入解压出来的文件夹里，建立一个`build`目录，然后进入这个目录

```bash
cd pvpgn-server-master
mkdir build
cd build
```

配置和编译

```bash
cmake -D WITH_MYSQL=true -D WITH_LUA=true ../
make && make install
```

运行

```bash
/usr/local/sbin/bnetd
```

配置文件路径：`/usr/local/etc/pvpgn/`

如果你是用文件储存数据，储存的文件在：`/usr/local/var/pvpgn/`

# 测试

最后你可以在`Battle.net Gateways Editor`中测试连接是否正常

![](/uploads/2019/09/pvpgn-1.png)

如果你做了内网映射，你可配置一下端口，即可从外网访问到你树莓派PvPGN服务器

![](/uploads/2019/09/pvpgn-2.png)

最后成功连上服务器，连接需要做一些操作，详情请看：[《魔兽争霸3连接PvPGN服务器》](/posts/437)

![](/uploads/2019/09/pvpgn-3.png)
