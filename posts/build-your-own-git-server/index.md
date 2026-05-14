---
id: 281
title: 搭建自己的Git服务器
date: 2019-08-01 14:17:39
tags:
  - git
  - 服务器
categories:
  - 瞎研究
---

# 服务器信息
CentOS 7.0 x86_64 (64bit)
这里用CentOS举例

# 安装Git

```bash
# CentOS
yum install git-core
# Ubuntu
apt-get install git
```

不多赘述，安装教程一搜一大把
[官网安装教程](https://git-scm.com/book/zh/v1/%E8%B5%B7%E6%AD%A5-%E5%AE%89%E8%A3%85-Git)

<!--more-->

# 创建用户

如果整个服务器只有你自己用，那无所谓，用root都行（大概吧）

```bash
# 一般来说会创建一个名叫git的用户
# 命令：adduser username
adduser git
```

设置密码

```bash
# 命令：passwd username
passwd git
# 然后输入密码
```

# 创建仓库
移动到需要创建仓库的目录中执行

```bash
# 比如我在 `/home/git/test/`下创建
cd /home/git/test
# 你可以切换到git用户来创建
su git
# 初始化仓库
git init --bare xxx.git
# 修改仓库所有者（不是git用户创建的情况下）
sudo chown -R git:git xxx.git
```

# 创建SSH

### 服务端

这步是为了不用每次提交、同步等操作都要输入密码
在用户目录下，也就是`/home/username/`中，有个隐藏目录`.ssh`
如果没有需要先创建，用户名叫git所以就在`/home/git/`下

```bash
# 移动至用户目录，如果用git登录的可以直接 cd ~
cd /home/git/
# 查看是否有.ssh
ls -a
# 如果没有，创建文件夹 并 设置文件夹所属 并 设置权限
# 命令：mkdir .ssh && chown -R username:groupname .ssh && chmod 700 .ssh
mkdir .ssh && chown -R git:git .ssh && chmod 700 .ssh
# 如果有 直接跳到下一步创建 authorized_keys
```

接着在`.ssh`目录下新建一个储存公钥的文件

```bash
# 移动到.ssh
cd .ssh
# 创建文件 并 设置文件所属 并 设置权限
# 命令：touch authorized_keys && chown -R username:usergroup authorized_keys && chmod 600 authorized_keys
touch authorized_keys && chown -R git:git authorized_keys && chmod 600 authorized_keys
```

### 本地
生成公钥，如果你本地没有公钥，则需要生成一个，打开终端输入

```bash
ssh-keygen -t rsa
```

我本地是Windows
生成的公钥在`C:\Users\username\.ssh\id_rsa.pub`，`username`是你的用户名
最后只需要把`id_rsa.pub`的内容粘贴到刚才在服务器创建的`authorized_keys`里就可以
多个公钥每行一个

# 克隆到本地
```bash
# git clone username@ip或域名:根目录开始的路径
git clone git@255.255.255.255:/home/git/test/xxx.git
```

# 后言
其实我在搭Git服务器的时候，主要问题在SSH，看了很多教程都是简单带过。最后慢慢试终于成功了，所以分享一下。
