---
id: 733
title: 树莓派 Cloudreve Aria2 离线下载
date: 2020-12-05 19:31:50
tags:
  - cloudreve
  - 树莓派
  - 网盘
  - 离线下载
categories:
  - 瞎研究
---

# Aria2

aria2是一个轻量级下载工具，支持HTTP、FTP、磁力链接等

cloudreve的离线下载功能会使用它进行下载

<!--more-->

# 下载

```bash
sudo apt install -y aria2
```

# 配置

## Aria2

网上找到的一份配置模板

需要修改的

- `rpc-secret` 需要你自己定义 ，cloudreve的配置中会用到
- `dir`下载文件夹，这个可以在cloudreve后台配置
- `save-session`和`input-file` 会话文件的位置，这个文件也需要自己创建

```bash
# 后台运行
daemon=true
# 用户名
# rpc-user=user
# 密码
# rpc-passwd=passwd
# 设置加密的密钥
rpc-secret=token
# 允许rpc
enable-rpc=true
# 允许所有来源, web界面跨域权限需要
rpc-allow-origin-all=true
# 是否启用https加密，启用之后要设置公钥,私钥的文件路径
# rpc-secure=true
# 启用加密设置公钥
# rpc-certificate=/home/pi/.config/aria2/example.crt
# 启用加密设置私钥
# rpc-private-key=/home/pi/.config/aria2/example.key
# 允许外部访问，false的话只监听本地端口
rpc-listen-all=true
# RPC端口, 仅当默认端口被占用时修改
# rpc-listen-port=6800
# 最大同时下载数(任务数), 路由建议值: 3
max-concurrent-downloads=5
# 断点续传
continue=true
# 同服务器连接数
max-connection-per-server=5
# 最小文件分片大小, 下载线程数上限取决于能分出多少片, 对于小文件重要
min-split-size=10M
# 单文件最大线程数, 路由建议值: 5
split=10
# 下载速度限制
max-overall-download-limit=0
# 单文件速度限制
max-download-limit=0
# 上传速度限制
max-overall-upload-limit=0
# 单文件速度限制
max-upload-limit=0
# 断开速度过慢的连接
# lowest-speed-limit=0
# 验证用，需要1.16.1之后的release版本
# referer=*
# 文件保存路径, 默认为当前启动位置(我的是外置设备，请自行坐相应修改)
dir=/home/pi/aria2/downloads
# 文件缓存, 使用内置的文件缓存, 如果你不相信Linux内核文件缓存和磁盘内置缓存时使用, 需要1.16及以上版本
# disk-cache=0
# 另一种Linux文件缓存方式, 使用前确保您使用的内核支持此选项, 需要1.15及以上版本(?)
# enable-mmap=true
# 文件预分配, 能有效降低文件碎片, 提高磁盘性能. 缺点是预分配时间较长
# 所需时间 none < falloc ? trunc << prealloc, falloc和trunc需要文件系统和内核支持
file-allocation=prealloc
# 不进行证书校验
check-certificate=false
# 保存下载会话
save-session=/home/pi/aria2/aria2.session
input-file=/home/pi/aria2/aria2.session
# 断点续传
save-session-interval=60
```

接下来配置服务

与`cloudreve`程序一样，新建一个`service`

```bash
sudo vim /lib/systemd/system/aria.service
```

在`ExecStart`执行调用程序并加载制定的配置文件的命令

```bash
[Unit]
Description=Aria2 Service
After=network.target

[Service]
User=pi
Type=forking
ExecStart=/usr/bin/aria2c --conf-path=/home/pi/.config/aria2/aria2.config

[Install]
WantedBy=multi-user.target
```

启动

```bash
# 开机启动
sudo systemctl enable aria
# 启动服务
sudo service aria start
```

开机启动

## Cloudreve

然后来到cloudreve的管理界面，这里配置都有说明就不多赘述了

只需要注意`RPC Secret`这项要跟aria2配置中的`rpc-secret`保持一致就行

![](/uploads/2020/12/raspberry-pi-cloudreve-aria2-1.png)

# 后言

cloudreve默认每过一分钟查询一次进度

![](/uploads/2020/12/raspberry-pi-cloudreve-aria2-2.png)

实际离线下载功能还有些许问题，我下载磁力链接遇到过的比如

- 添加离线下载任务后要等很长时间才会下载

- 下载到100%需要手动取消任务才会出现在网盘里

不过HTTP我试了是没问题的，正常下载，正常保存
