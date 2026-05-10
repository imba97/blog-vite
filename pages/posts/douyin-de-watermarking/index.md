---
id: 546
title: 抖音去水印
date: 2020-04-25 19:32:11
tags:
  - 去水印
  - 抖音
categories:
  - 瞎研究
---

# 前言

如果你是为了盗视频而看本教程，那就是本教程最大的失败。

我的初衷是因为网上那些小程序广告太多，功能区太鸡儿隐秘，令我感到极度不适。

至于为什么说是本教程最大的失败，因为这个社会什么牛鬼蛇神都有，我无法控制。盗视频这种弟弟行为，即使不看这个也会去搜其他教程、用其他软件。

# 手动打开无水印视频

抖音去水印教程，不借助其他去水印工具。

最后的PHP程序参考：[《【PHP】抖音无水印视频解析源码》](https://blog.csdn.net/a1258531/article/details/103775094)

<!--more-->

## 1.获取分享地址

点击抖音右下角的更多按钮

![](/uploads/2020/04/douyin_1.jpg)

点击“复制链接”

![](/uploads/2020/04/douyin_2.jpg)

## 2.浏览器打开

**先点一下播放**，让播放器加载出来，随后在视频上右键，点击“检查”

![](/uploads/2020/04/douyin_3.png)

## 3.复制视频地址并修改

右键`video`中的`src`的地址，选择“Copy link address”

![](/uploads/2020/04/douyin_4.png)

```
https://aweme.snssdk.com/aweme/v1/playwm/?s_vid=93f1b41336a8b7a442dbf1c29c6bbc56fa15389321801622b5036fe13b074f3fa77d6dadede77214dd28b0028f215f16a6eed3e3dc42e96288df31343cd9228b&line=0
```

把最前面的网址`https://aweme.snssdk.com/aweme/v1/playwm/`中的`playwm`改成`play`

就变成：`https://aweme.snssdk.com/aweme/v1/play/`，后面不变，这个就是**视频地址**

## 4.修改 User-Agent

如果直接打开是空白页面，我们需要自定义`User-Agent`

打开“Network conditions”

![](/uploads/2020/04/douyin_5.png)

复制以下内容

```
Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25
```

先去掉“Select automatically”的勾，再粘贴到下面的输入框中

![](/uploads/2020/04/douyin_6.png)

## 5.打开视频地址

最后再把视频地址粘贴到浏览器，打开即可。此时已经没有水印了。

![](/uploads/2020/04/douyin_7.png)

<style>#share_url,#share_code {width: 230px;text-align: center; border: none;border-bottom: 1px #000 solid;border-radius: 0;} #share_url {outline: none;} #share_btn{border:1px #000 solid; border-radius: 5px; background: none; outline: none; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;} #share_btn:active{background-color: #CCC;}</style>

<script>function analysis(){var share_url=document.querySelector('#share_url').value;var share_code=document.querySelector('#share_code').value;if(!/https?:\/\/v\.douyin\.com\/[a-zA-Z0-9]+/i.test(share_url)){ alert('分享地址格式错误');return;} $.get('https://bili.imba97.com/douyin/api.php?url='+share_url+'&code='+share_code, function(json){if(json.code==0){alert(json.msg);return;} var output=document.querySelector('#output'); output.href=json.url; output.innerText='点击此处跳转至视频' }); }</script>

# 去印员

以上就是本期教程，如果你喜欢我的教程，请支持imba久期博客网

最后，我们imba久期博客网还有一个假会员频道，叫去印员，里面有我们非独家的抖音去水印服务和精选文章

现在您可以直接把分享地址粘贴到这里：<input type="text" id="share_url" placeholder="https://v.douyin.com/xxxxxx/">

再输入我的专属邀请码：<input type="text" id="share_code" style="width:60px"> 就可以 <input type="button" id="share_btn" value="立即解析" onclick="analysis()">

<a id="output" href="javascript:void(0);" target="_blank" rel="noopener noreferrer"></a>
