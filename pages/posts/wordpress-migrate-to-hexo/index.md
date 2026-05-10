---
id: 734
title: WordPress 迁移至 Hexo
date: 2020-12-05 23:31:34
tags:
  - wordpress
  - hexo
  - 迁移
categories:
  - 瞎研究
---

记录一下本站从WordPress迁移至Hexo的过程

Hexo之前也接触过，不过只是看看，没摸

三个原因让我决定使用Hexo

<!--more-->

# 原因

## 服务器出大问题

第一个原因是服务器的`systemd`被我亿不小心覆盖了（当时提示是否覆盖，没仔细看直接回车了）

当时我就感觉，我的服务器不完整了，毕竟像开机启动的程序，都配置在里面

本来以为会开不了机，后来发现并不会

但我还是感觉，我的服务器被玷污了（草）

## 想试试纯静态化

第二个原因是偶然看到别的大佬的博客有篇文章，说的是把博客纯静态化的过程

## Markdown YES!

第三个原因是`Markdown`写作确实是爽，之前WordPress我还专门下了`Markdown`编辑器插件

现在想想，还好之前用了`Markdown`

# 迁移

Hexo提供了[迁移文档](https://hexo.io/zh-cn/docs/migration#WordPress)，可以用插件把WordPress导出的数据转成对应的文章

但实际非常拉胯，格式基本就没对过

于是我就想从数据库直接读出`Markdown`，但后来发现数据库中的数据，换行等字符是被转义过的，也没法直接用

最后没辙，就只能展现我的手艺了：**复制粘贴**（老手艺人了）

从WordPress后台，打开每篇文章的编辑页面，一点点把自动迁移的文档内容给替换掉了

其实迁移插件还是有点用的，至少文章类型、标签、发布时间还是都有的，也算省了很多事吧

# 教程

## 在本地安装 Hexo

根据[官网文档](https://hexo.io/zh-cn/docs/)，你需要有`nodejs >=10.13`和`git`，可自行在[Node.js官网](https://nodejs.org/en/)和[Git官网](https://git-scm.com/)下载

```bash
# 安装Hexo命令行工具
npm install hexo-cli -g
# 在合适的目录创建博客
hexo init blog
# 进入博客目录
cd blog
# 安装依赖 如果安装失败或极慢 可以考虑使用 cnpm
npm install
# 启动服务器
hexo server # 简写 hexo s
```

这样本地工作暂时告一段落

## 服务器网站配置

因为我是重装了系统，所以都需要从头来

开机第一步，宝塔 install

根据[宝塔文档](https://www.bt.cn/bbs/thread-19376-1-1.html)，我是`CentOS`系统，使用以下组合命令下载`wget`，使用`wget`下载宝塔安装脚本，安装宝塔

```bash
yum install -y wget && wget -O install.sh http://download.bt.cn/install/install_6.0.sh && sh install.sh
```

宝塔安装好后进入后台，自行配置一下

然后服务器建议用`Nginx`，其他看你需求

![](/uploads/2020/12/wordpress-to-hexo-1.png)

安装好后添加静态网站

![](/uploads/2020/12/wordpress-to-hexo-2.png)

服务器的网站部分就到这了

如果你不想用宝塔这种管理软件，你也可以自行安装`Nginx`，只要网站运行起来就OK

## 自动部署服务器配置

自动部署是将你本地的`Hexo`生成的静态页面自动上传到服务器上

原理是用了`git hook`，当你`push`的时候，会在服务器执行命令让网站目录强制`checkout`最新的代码

首先我们需要在服务器上创建一个`git`仓库，这个步骤你可以参考[《搭建自己的Git服务器》](/posts/281)

创建好仓库后，不必克隆到本地，而是使用一个插件

## 自动部署本地配置

安装`hexo-deployer-git`插件，在本地的博客目录下执行

```bash
npm install hexo-deployer-git --save
```

然后在`_config.yml`添加配置，将你的仓库地址改成对应的

```yaml
deploy:
  type: git
  repo: git@IP:/home/git/blog.git # 仓库地址
  branch: master
```

## 权限问题

参考：[《将Hexo部署到自己的服务器上》](https://www.cnblogs.com/jie-fang/p/13445939.html)

为`git`用户设置权限

```bash
# 修改权限配置文件的权限（默认是只读）
chmod 740 /etc/sudoers
# 编辑
vim /etc/sudoers
# 修改完可以再把权限改回来
chmod 400 /etc/sudoers
```

找到 `root ALL=(ALL) ALL`，在下面新加一条

```ini
git  ALL=(ALL)  NOPASSWD: ALL
```

这里我加了一个`NOPASSWD`，是为了执行`sudo`时无需输入密码，后面会用到

## Git Hook

在仓库地址下`hooks`目录中创建一个文件

```bash
vim /home/git/blog.git/hooks/post-receive
```

添加以下内容，`--work-tree`是网站根目录，`--git-dir`是仓库目录

```bash
#!/bin/sh
sudo chown -R git:git /www/wwwroot/blog
sudo git --work-tree=/www/wwwroot/blog --git-dir=/home/git/blog.git checkout -f
sudo chown -R www:www /www/wwwroot/blog
```

因为我装了宝塔，宝塔网站目录默认的用户是`www`，如果直接`checkout`会报错没权限，直接改成`git`又会让网页会加载不出来

所以这里就先把它变成`git`用户的，`checkout`完后改回`www`用户

# 使用

Hexo可真是太舒服了，在`source/_posts`编辑文章

你可以用命令创建文章模板

```bash
hexo new post "文章标题"
```

编辑完后

```bash
# 生成静态文件
hexo g
# 可以先在本地开启服务器，检查文章
hexo s
```

检查到需要修改时可以不用停止服务器，直接改完刷新浏览器的网页就能生效

觉得没问题后，部署到你的服务器

```bash
hexo d
```

如果你改过配置或者生成的静态文件不对，你需要在生成前先清理一下

```bash
hexo clean
```

OK，以上就是本期文章

# 爷青结

用了两年多的WordPress退役了，👴的青春结束了
