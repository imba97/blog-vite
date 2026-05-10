---
id: 280
title: Git服务器自动同步部署到项目
date: 2019-08-06 11:37:54
tags:
  - git
  - 同步
  - 自动
  - 部署
categories:
  - 瞎研究
---

上次简单说了[搭建Git服务器](/archives/281)，这次来聊聊自动同步部署到项目。这种方式会很方便，比如用在网站上，只需要点一下push，线上的网站就会同步。这个教程的前提是网站放在Git服务器上。

<!--more-->
# 前言

发现之前的文章有几处错误，又经过一大堆测试，直接登录git用户模拟了一遍操作等，终于找到比较完善的方法了。

![](/uploads/2019/08/ef06969c39226befcb45e6b110ee3e08.png)

# 解决疑难杂症

1. 查看项目目录下的`.git`，所属是否是`git`用户的，如果不是需要修改

```bash
chown -R git:git .git
```

2. git报错

```bash
[git用户 g]$ git pull
remote: Counting objects: 5, done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 2), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From /git/g
   528b0d2..9b2e4c3  master     -> origin/master
Updating 528b0d2..9b2e4c3
error: unable to unlink old 'index.php' (Permission denied)
```

没有权限更新，解决这个问题可以使用`sudo`命令，但这样又会引出一个新问题。

3. sudo问题

你需要先在`/etc/sudoers`文件中把执行sudo命令的用户加上，否则会报错

```bash
vim /etc/sudoers
```

把git用户加上，并且不需要密码

```bash
git ALL=(ALL)NOPASSWD:ALL
```

但sudo还有一个问题

```bash
[git@用户 g]$ sudo git pull
Updating 528b0d2..9b2e4c3
Fast-forward
 index.php | 1 +
 1 file changed, 1 insertion(+)

[git@用户 g]$ ll
-rw-r--r-- 1 root root  5105 Aug 14 19:03 index.php
```

就是用户和用户组变成了`root`，这样网页会打不开显示拒绝访问，就不得不使用`chown`来更换，所以Git钩子文件就得这样写。

# Git钩子

在相应的Git项目目录中，进入`hooks`目录，新建或更改`post-receive`文件，用自己装的编辑器打开，使用命令。

```bash
vim post-receive
```

输入以下信息

```bash
#!/bin/sh
cd /www/wwwroot/myWebSite || exit
unset GIT_DIR
sudo git reset --hard
sudo git pull origin master
sudo chown -R www:www *
```

`sudo git reset --hard`是解决报错`Your local changes would be overwritten by merge. Commit, stash or revert them to proceed`，这是因为拉取代码时发现本地代码有过修改，所以提示你提交一下项目目录代码，但我们并不要提交，于是使用`sudo git reset --hard`可以放弃项目目录修改（其实不是修改，只是跟git上的不同），让拉取的代码覆盖项目目录的代码，实现硬更新。

`sudo chown -R www:www *`是把当前目录所有文件的所有者改为`www`用户和`www`用户组，这个用户是文件原本的用户，如果你的是其他的请自行更改，`.git`是隐藏目录所以不会被修改，但如果被修改需要你再改回来，在下面添加命令`sudo chown -R git:git .git`就可以。

这样就完成了，下次push项目后就会被触发，自动在`myWebSite`目录下拉取相应分支的更新、更改用户和用户组。

# 后言

像这种更改`git`用户获取权限不用密码的方式，我不确定安全性怎么样，还请大佬指教。
