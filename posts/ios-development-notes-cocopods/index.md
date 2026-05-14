---
id: 493
title: iOS 开发笔记 - CocoaPods
date: 2020-02-17 17:59:00
tags:
  - ios
  - cocoapods
categories:
  - 笔记
---

## 简介

CocoaPods是专门为iOS工程提供第三方依赖库的管理工具，类似Node.js中的npm

<!--more-->

## 安装

```bash
# 移除原生镜像
gem sources --remove https://rubygems.org/
# 添加国内镜像
gem sources --add https://gems.ruby-china.com/
# 安装CocoaPods
gem install cocoapods
# 设置
pod setup
```

## 使用

在`.xcodeproj`文件所在目录下

```bash
# 初始化
pod init
```

此时目录下会创建一个`Podfile`的文件，编辑文件

如果使用`Swift`，需要在里面添加`use_frameworks!`这行代码，里面默认应该是注释的，打开即可

```bash
# 查找需要的框架
pod search afn
```

如果报错`Unable to find a pod with name, author, summary, or description matching AFNetworking`，使用另一种方式安装`Cocoapods`

```bash
gem install cocoapods --pre
```

比如我们需要用`AFNetworking`，在`Podfile`中添加

```bash
pod 'AFNetworking'
```

保存后在终端输入命令安装，普通安装会默认升级CocoaPods的spec仓库，速度会很慢，此时需要在安装时添加参数`--no-repo-update`

```bash
# 安装框架
pod install --no-repo-update
```

完成后在项目中会多一个`.cworkspace`的文件，关闭当前Xcode工程，之后打开项目都用`.cworkspace`这个文件

`install`只是第一次安装时用，之后如果修改`Podfile`使用`update`

```bash
pod update --no-repo-update
```

如果报错
`[!] Unable to add a source with url https://github.com/CocoaPods/Specs.git named cocoapods.`
`You can try adding it manually in /Users/bluepanda/.cocoapods/repos or via pod repo add.`

使用以下方式手动进入`repo`目录，从Git上克隆master分支，其实主要原因应该是被墙，用梯子给git上一个代理，就可以了

```bash
# 设置git代理，具体端口看梯子的设置
git config --global http.proxy 'socks5://127.0.0.1:1086'
git config --global https.proxy 'socks5://127.0.0.1:1086'
# 执行手动克隆
pod setup
pod repo remove master
cd ~/.cocoapods/repos
git clone https://github.com/CocoaPods/Specs master
```

如果报错`[!] CDN: trunk URL couldn't be downloaded: https://raw.githubusercontent.com/CocoaPods/Specs/master/Specs/0/0/e/AFNetwork/0.1.0/AFNetwork.podspec.json Response: Couldn't connect to server`

需要在`Podfile`中添加以下代码

```bash
source 'https://github.com/CocoaPods/Specs.git'
```

开启梯子，再执行安装命令

```bash
pod install
```

## 使用

OC使用第三方框架时需要加载头文件

```objective-c
#import <AFNetworking/AFNetworking.h>
```

Swift使用第三方框架需要加载Pods项目下Pods目录中的文件夹名称

```swift
import AFNetworking
```
