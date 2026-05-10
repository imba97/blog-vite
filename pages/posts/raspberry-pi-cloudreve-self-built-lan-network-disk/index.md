---
id: 732
title: 树莓派 Cloudreve 自建局域网网盘
date: 2020-12-02 16:57:17
tags:
  - cloudreve
  - 树莓派
  - 私人网盘
  - 网盘
categories:
  - 瞎研究
---

# Cloudreve

[Cloudreve](https://cloudreve.org/) 是个网盘系统，包含前后端，解压即用，贼吉尔方便

<!--more-->

## 下载

在 [Github](https://github.com/cloudreve/Cloudreve/releases) 找到对应的压缩包，树莓派下载`arm`的

复制链接，使用`wget`下载到树莓派

```bash
wget https://github.com/cloudreve/Cloudreve/releases/download/x.x.x/cloudreve_x.x.x_linux_arm.tar.gz
```

## 解压

```bash
tar -zxvf cloudreve.tar.gz
```

解压出来之后是个可执行文件`cloudreve`

首先先执行一次，会自动在当前目录创建一个配置文件`conf.ini`，并显示默认帐号和随机生成的密码

Cluedreve 默认存储是`SQLite`本地存储，所以会在当前目录创建一个`.db`的文件

# Mysql

不过它支持`mysql`，这里我选用`mysql`

## 安装

```bash
sudo apt install mysql-server
```

如果因为软件源的问题提示未找到`mysql-server`，你可以试试安装另一个，这两个是一样的

```bash
sudo apt install mariadb-server
```

安装好后启动服务

```bash
sudo service mysql start
```

设置root密码

```bash
sudo mysqladmin -u root password 123456
# 顺带一提 修改密码的话执行以下命令并输入你原来的密码
sudo mysqladmin -u root -p password 123456
```

接下来就可以进入Mysql了

```bash
mysql -u root -p
```

## 创建数据库

我们要创建一个数据库，名字可以随便起，这里我就叫`cloudreve`

```bash
create database cloudreve;
```

你可以输入`show databases;`查看当前有哪些数据库

![](/uploads/2020/12/raspberry-pi-cloudreve-1.png)

## 启用mysql

在 Cluedreve 配置文件启用mysql

```ini
[System]
# 省略...

[Database]
Type = mysql
User = root
Password = root
Host = 127.0.0.1
Name = cloudreve
```

# 开机启动

创建一个`service`文件，配置开机启动

```bash
sudo vim /lib/systemd/system/cloudreve.service
```

复制以下代码，把`WorkingDirectory`和`ExecStart`改为你的路径

```ini
[Unit]
Description=Cloudreve
Documentation=https://docs.cloudreve.org
After=network.target
Wants=network.target

[Service]
Type=simple
WorkingDirectory=/home/pi/cloudreve
ExecStart=/home/pi/cloudreve/cloudreve
Restart=on-abnormal
RestartSec=5s
KillMode=mixed

StandardOutput=null
StandardError=syslog

[Install]
WantedBy=multi-user.target
```

设置开机启动并且开启服务

```bash
# 开机启动
sudo systemctl enable cloudreve
# 开启服务
sudo service cloudreve start
```

# 完成

访问`树莓派IP:端口`，你就能看到登录页了

![](/uploads/2020/12/raspberry-pi-cloudreve-2.png)
