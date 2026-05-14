---
id: 506
title: frp内网穿透 树莓派+阿里云服务器
date: 2020-04-02 17:01:30
tags:
  - frp
  - 内网穿透
  - 服务器
  - 树莓派
categories:
  - 瞎研究
---

# 前言

本教程以树莓派+阿里云服务器为例，两者都是linux系统，不涉及其他配置方案

# 下载

首先打开frp在github上的发布版本，找到你要下载的版本，复制压缩包的地址。
服务器：`frp_版本号_linux_amd64.tar.gz`
树莓派：`frp_版本号_linux_arm.tar.gz`

示例：`https://github.com/fatedier/frp/releases/download/v0.32.1/frp_0.32.1_linux_amd64.tar.gz`
树莓派：`https://github.com/fatedier/frp/releases/download/v0.32.1/frp_0.32.1_linux_arm.tar.gz`

发布地址：[https://github.com/fatedier/frp/releases](https://github.com/fatedier/frp/releases)

在阿里云和树莓派使用命令下载

```bash
# 先到合适的目录 使用wget命令
wget https://github.com/fatedier/frp/releases/download/v0.32.0/frp_0.32.0_linux_amd64.tar.gz
```

<!--more-->

# 解压

使用以下命令解压刚才下好的压缩包

```bash
tar -zxvf frp_0.32.0_linux_amd64.tar.gz
```

解压好后会出现`frp_0.32.0_linux_amd64`文件夹，首先进入文件夹

```bash
cd frp_0.32.0_linux_amd64
```

# 服务器（服务端）配置

配置文件是`frps.ini`，默认内容如下

```ini
[common]
bind_port = 7000
```

如果你服务器上的7000端口没有其他用途，默认这个配置就可以

# 树莓派（客户端）配置

配置文件是`frpc.ini`，默认内容如下

```ini
[common]
server_addr = 127.0.0.1
server_port = 7000

[ssh]
type = tcp
local_ip = 127.0.0.1
local_port = 22
remote_port = 6000
```

`[common]`和`[ssh]`是个名称

```ini
server_addr = 阿里云服务器的IP地址
server_port = frp服务端的端口号

type = 协议类型
local_ip = 本地地址
local_port = 本地端口
remote_port = 远程端口
```

# 客户端新增配置案例

假设

服务器的IP地址是`50.60.70.80`
我电脑的内网IP地址是`192.168.1.10`
电脑上开了个网站，端口是`80`

那么客户端的`frpc.ini`配置是这样的，首先`[common]`是必须的，它指向了服务器的`frp`
然后自定义一个，比如`[website]`，下面是具体写法

```ini
[common]
server_addr = 50.60.70.80
server_port = 7000

[website]
type = http
local_ip = 192.168.1.10
local_port = 80
remote_port = 6000
```

配置完后重启frp，我在电脑浏览器输入`50.60.70.80:6000`就能打开我本地电脑的网站了

# 客户端的启动和开机启动

启动可以在`frpc`所在的文件夹下执行以下命令

```bash
./frpc -c ./frpc.ini
```

开机启动则需要在`/etc/init.d`目录下创建一项服务

```bash
# 移动
cd /etc/systemd/system
# 创建文件
vim frpc.service
```

添加以下内容，里面的`ExecStart`就是要执行的代码，需要用绝对路径

```ini
[Unit]
Description=frpc
After=syslog.target network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/home/pi/frpc -c /home/pi/frpc.ini
Restart= always
RestartSec=1min

[Install]
WantedBy=multi-user.target
```

使用以下命令启动、停止、重启

```bash
service frpc start
service frpc stop
service frpc restart
```

使用以下命令添加开机启动

```bash
systemctl enable frpc.service
```

# 服务器的启动和自动启动

同理，操作步骤一样的，只不过服务器的是`frps`

```bash
./frps -c ./frps.ini
```

创建服务

```bash
# 移动
cd /etc/systemd/system
# 创建文件
vim frps.service
```

添加以下内容

```ini
[Unit]
Description=frps
After=syslog.target network.target
Wants=network.target

[Service]
Type=simple
ExecStart=/home/imba97/frps -c /home/imba97/frps.ini
Restart=always
RestartSec=1min

[Install]
WantedBy=multi-user.target
```

使用以下命令启动、停止、重启

```bash
service frps start
service frps stop
service frps restart
```

使用以下命令添加开机启动

```bash
systemctl enable frps.service
```

# 阿里云

如果要用阿里云的话：[推广链接](https://www.aliyun.com/minisite/goods?userCode=ujl29kt5)
