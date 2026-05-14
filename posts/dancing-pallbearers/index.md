---
id: 628
title: 用JS把网页统统抬走
date: 2020-05-29 17:31:53
tags:
  - javascript
  - 黑人抬棺
categories:
  - JavaScript
---

用JS做了个黑人抬棺的搞怪类程序，可以把网页统统抬走。

<!--more-->

# 使用方法

**第一种方式**，直接把下面这个拖到收藏夹。然后在**任意页面**点击使用

<a id="code_a" alt="当场抬走" href="javascript:void(0);">当场抬走</a>

**第二种方式**，复制以下`javascript`代码，在浏览器收藏夹右键->添加网页->起个名字->在网址里粘贴代码

<!-- eslint-disable -->
```javascript
javascript:if(document.querySelector('#koe_msg')===null){if(document.querySelector('#koe_video')===null){var koe_msg=document.createElement('p');koe_msg.innerText='正在去世';koe_msg.setAttribute('id','koe_msg');koe_msg.setAttribute('style','position:fixed;top:0;left:0;width:130px;height:30px;line-height:30px;text-align:center;background-color:#000;color:#FFF;font-size:26px;z-index:99999999');document.body.appendChild(koe_msg);var koe_played=true;var koe_video=document.createElement('video');koe_video.setAttribute('id','koe_video');koe_video.setAttribute('autoplay','');koe_video.setAttribute('name','media');koe_video.addEventListener('canplaythrough',function(){koe_msg.remove();document.body.setAttribute('style','filter: grayscale(100%); -moz-filter: grayscale(100%); -o-filter: grayscale(100%); -webkit-filter: grayscale(100%);')});koe_video.addEventListener('pause',function(){document.body.setAttribute('style','');koe_played=false});koe_video.addEventListener('play',function(){document.body.setAttribute('style','filter: grayscale(100%); -moz-filter: grayscale(100%); -o-filter: grayscale(100%); -webkit-filter: grayscale(100%);');koe_played=true});var koe_source=document.createElement('source');koe_source.setAttribute('src','https://onedrive.gimhoy.com/1drv/aHR0cHM6Ly8xZHJ2Lm1zL3UvcyFBcDVHUVdqS1ViZm5nLWwtTk5nMVlSVlFJRThJclE/ZT1HbFZ5VHE=.mp3');koe_source.setAttribute('type','audio/mpeg');koe_video.appendChild(koe_source);document.body.appendChild(koe_video)}else{if(koe_played){document.querySelector('#koe_video').pause()}else{document.querySelector('#koe_video').play()}}}void(0);
```

第二种方式有可能会被浏览器自动删掉**最前面的**`javascript:`，粘贴上后检查一下，没有的话需要自己手动加一下

<script>make_js();</script>
