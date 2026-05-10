---
id: 441
title: 被恶心了两次的PHP安装错误
date: 2019-09-11 15:17:05
tags:
  - Laravel
  - OpenSSL
  - PHP
  - XAMPP
categories:
  - 瞎研究
---

web开发中我是用的XAMPP集成环境，安装的PHP版本是`5.6`，我又单独下了个`7.3`版本，这样只需要单独写个配置文件，之后切换加载不同的配置文件就可以切换PHP版本了。

这次的问题是，昨天PHP-7.3的目录坏了，原因至今不详

![](/uploads/2019/09/php-7.3.png)

<!--more-->

打不开也删不掉，我决定这个先暂时放一放，直接去下载一个新的PHP

于是在官网下完后，解压、改名，接下来修改配置文件，新的PHP是没有`php.ini`这个文件的，但在文件夹下有两个文件`php.ini-development`和`php.ini-production`是`php.ini`的模板，分别对应着开发版和线上版，根据需要复制一份然后把名字改成`php.ini`就可以

这还没结束，你还需要开启扩展，比如`;extension=openssl`，把你需要的扩展前面的分号去掉

## 这次的问题

运行Apache、Mysql一切正常，打开最近用Laravel开发的网站发现，它报了个错！

```bash
Call to undefined function Illuminate\Encryption\openssl_cipher_iv_length()
```

我一想，版本跟之前一样，配置跟之前一样，咋会报错呢，而且跟openssl有关。类似的问题之前有过，都是openssl，只不过报错不同。在网上搜这个错误得到的结果基本是你没开启openssl扩展，但我开了。

## 解决

也纯属巧合，本来打开`php.ini`搜了一下extension关键字想去再确认一下还有没有跟openssl有关的其他扩展，结果突然看到`;extension_dir = "ext"`是被注释的！

突然想起来，上次报错的问题也是这么解决的，时间长了就忘了，这次写在这备份！

那个意思就是扩展的目录，指定存放扩展的文件夹是哪个。
