---
id: 772
title: Fedora Docker 自动关闭的问题
date: 2023-12-15 23:38:57
tags:
  - Fedora
  - 自动休眠
categories:
  - 笔记
---

# 事件回放

之前在做 Homelab 的时候用到了 `Fedora` 这个系统，做显卡直通后，在系统中单独跑一个 `Jellyfin` 可以开启硬件解码

但后面发现 `Jellyfin` 时不时就打不开了，最开始没发现什么问题，也找到了一个简易解决方案，就是执行以下 `docker ps` 就启动了

之后感觉是系统休眠问题，于是就搜了一下 `Fedora` 怎么关闭自动休眠，但没搜到命令

# 关闭自动休眠

昨天仔细找了找，发现了关闭自动休眠的命令，`Fedora` 也可以用

```bash
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

记录一下

# 添加自动重启

之前加了个音乐服务，使用频率大幅增加

然后发现即使是不进入休眠，过几天也会莫名其妙挂，甚至 `SSH` 也连不上，所以设置了自动重启

打开计划任务 `crontab -e`，根据自己需要添加启动时间，我这里设置每天 5 点重启

```
0 5 * * * reboot
```

# 添加 NAS 挂载重试

2024-04-20 更新

最近发现 `NAS` 有一次没挂上，用的是 `nfs`

```bash
vim /etc/fstab
```

在网页管理后台添加 `nfs` 后，默认会有一段，然后只需要在 `defaults` 后面添加重试次数即可

```
192.168.1.200:/NAS /NAS nfs defaults,x-systemd.mount-retries=5 0 0
```
