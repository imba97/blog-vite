---
id: 467
title: 搭建PHP环境 Apache PHP MySQL
date: 2019-11-19 19:02:43
tags:
  - apache
  - mysql
  - PHP
  - 非集成环境搭建
categories:
  - 瞎研究
---

PHP非集成环境的搭建笔记。

下载地址：

- [Apache](https://www.apachehaus.com/cgi-bin/download.plx)
- [PHP](https://windows.php.net/download)
- [MySQL](https://dev.mysql.com/downloads/mysql/)

<!--more-->

# Apache 和 PHP 的配置

Apache 配置文件：`Apache/conf/httpd.conf`

```shell
# 监听端口
Listen 80

# 服务器名 可能是改了监听端口才需要改这里
ServerName localhost:80

# 设置常量 根据你的Apache路径设置
Define SRVROOT "E:/Apache"

# 设置 Apache 的路径
ServerRoot "${SRVROOT}"

# php7_module (新增)
LoadModule php7_module "E:/phprumtime/php-7.3.11/php7apache2_4.dll"

# 线程安全 (新增)
LoadFile "E:/phprumtime/php-7.3.11/php7ts.dll"

# 关联PHP (新增)
<FilesMatch "\.php$">
  setHandler application/x-httpd-php
</FilesMatch>

# 设置 php.ini 所在文件夹 (新增)
<IfModule php7_module>
    PHPIniDir "E:/phprumtime/php-7.3.11"
</IfModule>

# 设置项目目录
DocumentRoot "${SRVROOT}/htdocs"
<Directory "${SRVROOT}/htdocs">
    # 略···
</Directory>
```

PHP 配置文件：`PHP/php.ini`

如果不存在你需要复制`php.ini-development`或`php.ini-production`，在重命名为`php.ini`即可。

```shell
# 配置扩展目录 根据你的路径设置
extension_dir = "E:/PHP/ext"

# 根据需要开启扩展
extension=mysqli
# ···

# 设置中国时区 (可选)
date.timezone = PRC
```

# 使用 Apache

首先用管理员打开终端，切换目录到`Apache/bin`下

```shell
# 安装 不成功的话在前面加 .\ 试试
httpd -k install
```

成功会显示以下信息：

`The 'Apache2.4' service is successfully installed.`
`Testing httpd.conf....`
`Errors reported here must be corrected before the service can be started.`

然后开启 Apache

```shell
httpd -k start
```

至此你就可以访问并运行PHP程序了

# MySQL 的配置

MySQL 配置文件：`MySQL/my.ini`，如果没有则自己创建

```shell
[client]
# 设置客户端字符集
default-character-set=utf8mb4

[mysqld]
# 设置端口
port = 3306
# 设置mysql的安装目录
basedir=E:\\MySQL
# 设置 mysql数据库的数据的存放目录
datadir=E:\\MySQL\\sqldata
# 允许最大连接数
max_connections=20
# 设置服务器字符集
character-set-server=utf8mb4
# 创建新表时将使用的默认存储引擎
default-storage-engine=INNODB
```

使用管理员打开终端，进入 MySQL/bin 目录

初始化数据库

```shell
mysqld --initialize --user=root --console
```

成功会提示：`[Server] A temporary password is generated for root@localhost: _9k;Por<3!NN`

后面的`_9k;Por<3!NN`就是初始化默认的随机密码

```shell
# 安装服务
mysqld --install

# 开启服务
net start mysql
```

安装时如果提示`Install/Remove of the Service Denied!`说明你没使用管理员打开终端

如果没记录下密码，只需要删掉my.ini中设置的`datadir`目录，再重新初始化一遍即可

接下来就可以使用服务器连接工具或者终端，使用上面的密码连接数据库后再修改密码即可
