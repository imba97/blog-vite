---
id: 682
title: 斐讯N1 旁路由
date: 2020-08-06 21:24:23
tags:
  - phicomm
  - 斐讯
  - 旁路由
categories:
  - 瞎研究
---

# 烧录镜像

插入空U盘，打开软件`balenaEtcher`，选择镜像，选择U盘，Flash!

操作过于简单就不上图了，软件和镜像都整合在云盘里了，地址在下面。

# 盒子信息和配置

首先连接显示器和鼠标，只支持HDMI，开机后可以看到固件版本和IP地址，如果不是网线连接，可以在这个界面连接WiFi。

然后在固件版本上点4下，会提示`打开adb`，如果关闭了再点4下打开。

![](/uploads/2020/08/n1-1.png)
> 图片来自网络

# 连接电脑

用双公USB接口连接盒子和电脑，需要做一下操作。

## 降级

如果固件版本大于`V2.19`则需要降级，打开降级工具文件夹，在`onekey`目录下有个`run.bat`批处理文件，运行它。

输入2选择N1降级，再输入盒子的IP

![](/uploads/2020/08/n1-2.png)

然后根据提示操作，最后盒子会重启。降级后在界面上不会显示，只要降级软件提示`Boot分区降级完毕`之类的成功的提示就OK了。

## 设置U盘启动

这个跟降级操作类似，使用`N1盒子激活U盘启动.bat`，输入盒子的IP地址进行自动设置。

下面就会进入U盘中刷入的openwrt中，命令行界面不支持高分辨率屏幕的显示，但我们也不需要用命令。

# 旁路由配置

## IP

首先需要配置一下IP地址，openwrt默认的地址是`192.168.1.1`，一般情况下我们可以直接把盒子接在路由器上，输入这个IP地址访问。

但如果你家里的光猫或路由器使用了这个地址，你需要先把盒子跟电脑连接，然后访问`192.168.1.1`来更改IP

比如我家光猫网关是`192.168.1.1`，我屋里的路由器网关是`192.168.2.1`，最终需要把

## AdGuard Home

**1. 设置密码**

下面有个生成密码，点添加后会在上面的选项中出现“改变网页登录密码”

![](/uploads/2020/08/n1-3.png)

输入明文密码，加载计算模块，然后点计算

复制里面的内容，来到说动设置，替换掉`password: `后面那些内容

**2. 5553重定向**

如果只开这个功能，可以设置为“重定向53端口到AdGuardHome”

如果配合SmartDNS使用，需要设置成“作为dnsmasq的上游服务器”

**3. AdGuard Home Web**

这里是 AdGuard Home 的界面，有数据统计和拦截规则等配置

在 过滤器 DNS封锁清单 中可以配置过滤规则

![](/uploads/2020/08/n1-4.png)

这里放几个我在用的规则

名称 | 地址
- | -
anti-AD | https://anti-ad.net/easylist.txt
HalfLifeL | https://gitee.com/halflife/list/raw/master/ad.txt
乘风-广告 | https://gitee.com/xinggsf/Adblock-Rule/raw/master/rule.txt
乘风-视频 | https://gitee.com/xinggsf/Adblock-Rule/raw/master/mv.txt
cjxlist | https://gitee.com/cjx82630/cjxlist/raw/master/cjx-ublock.txt

要说一点，视频规则基本没啥用，没法屏蔽视频广告，还是得靠插件，比如：[广告终结者](https://www.adtchrome.com/)

**4. 配合SmartDNS的设置**

如果是配合SmartDNS用，你需要把上游DNS服务器设置为SmartDNS

在 这只 DNS设置 中 上游DNS服务器 和 Bootstrap DNS 服务器 都设置为 `127.0.0.1:6053`

然后DNS缓存配置改为0，因为SmartDNS中已经设置了缓存

![](/uploads/2020/08/n1-5.png)

**5. 我目前在尝试的配置**

也是结合SmartDNS，我现在SmartDNS的自定义设置中，添加两行代码

```ini
bind :6153 -group cn
bind :6253 -group overseas
```

意思是把`6153`绑定到分组名称叫`cn`的组上，`6253`绑定到`overseas`组

然后在 AdGuard Home 中添加两个上游服务器，再把模式设置成“最快的IP地址”

**使用报告**

发现不用绑定端口，直接用`6053`和`7913`就可以，而且最快IP是这两个端口的，不是SmartDNS中DNS服务器

还有就是请求`6053`和`7913`，SmartDNS去找你连接的最快的DNS服务器，而不是当前访问域名最快的DNS服务器，所以还是有些问题，但都写上吧，没啥问题

## SmartDNS

**1. 上游服务器**

点击添加，可以自行搜索添加各种国内国外的DNS服务器，国外的DNS服务器设置一下分组名称

**2. 基本设置**

域名预加载 可以勾选

缓存大小建议在这里设置，我设置的是 5120

域名TTL我这里是 300 和 3600

**3. 第二DNS服务器**

本地端口 7913

跳过双栈优选 和 跳过cache 打勾

服务器组写刚才设置的国外DNS服务器分组名称

# 软件、镜像、工具

[AdGuardHome_linux_armv6.tar.gz](http://static.imba97.com/uploads/AdGuardHome_linux_armv6.tar.gz)

[百度云](https://pan.baidu.com/s/1QH08qyRv7P-6QcWEikKOuA) 【g4n4】
