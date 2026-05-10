---
id: 463
title: 如何手动找回B站失效视频
date: 2019-11-05 17:29:45
tags:
  - bilibili
  - 失效视频
  - 收藏夹
categories:
  - 瞎研究
---

<!-- BV转AV - 参考 http://bv2av.com/ -->
<script>var avbv={table:'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF',xor:177451812,add:8728348608,s:[11,10,3,8,4,6]};var isIziToast=typeof iziToast==='object'&&typeof iziToast.show==='function';function bv2av(bv){var errorMessage='';if(!/[bB][vV][fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF]{10}/.test(bv)){errorMessage='BV号有误'}if(errorMessage!==''){if(isIziToast){iziToast.show({title:'错误',message:errorMessage,class:'shadow',position:'topRight',backgroundColor:'#FF6666',titleColor:'#ffffff',messageColor:'#ffffff',iconColor:'#ffffff',progressBarColor:'#ffffff',icon:'fa fa-check',timeout:3000})}else{alert(errorMessage)}return false}var result=0;for(var i=0;i<6;i++){result+=avbv.table.indexOf(bv[avbv.s[i]])*Math.pow(58,i)}var av=(result-avbv.add^avbv.xor);return 'av'+av}</script>

以Chrome浏览器举例，首先右键失效视频，检查

![](/uploads/2019/11/1.png)

<!--more-->

找到父级的`li`标签，有一个`data-aid`属性，这里就是BV号

![](/uploads/2019/11/2.png)

打开 [https://www.biliplus.com/](https://www.biliplus.com/) 在里面搜索这个AV号或BV号

或者直接把AV号或BV号粘贴在这：<input type="text" id="avNo"><input type="button" id="avBtn" onclick="msg()" style="border:none;border-radius:5px;margin-left:5px;padding:6px;cursor:pointer;" value="搜索">
<script>function msg(){var avNo=document.querySelector('#avNo');var bv2avNo=bv2av(avNo.value);if(bv2avNo===false) return;if(!/^(a|A)(v|V)(\d+)$/.test(bv2avNo)){if(isIziToast){iziToast.show({title:'错误',message:'AV号有误',class:'shadow',position:'topRight',backgroundColor:'#FF6666',titleColor:'#ffffff',messageColor:'#ffffff',iconColor:'#ffffff',progressBarColor:'#ffffff',icon:'fa fa-check',timeout:3000})}else{alert('AV号有误')}return}avNo.value=bv2avNo;window.open('https://www.biliplus.com/video/'+avNo.value)}</script>

如果有缓存，就找到，没缓存，那就没办法了

封面有些情况可能是虽然有缓存，但B站把封面原图文件删了，那也找不回来

![](/uploads/2019/11/3.png)

另外浏览器插件 Btools 1.1.2 发布了，新版本中的其中一个功能就是用这个原理自动搜索失效视频。

火狐浏览器、谷歌浏览器均已上架。

下面是截图。

![](/uploads/2019/10/announcement-2019-10-04-1.gif)

插件里功能更丰富，获取过一次缓存的视频信息会被保存下来，下次就不会查询视频而是把保存下来的视频信息直接加载到页面上，感兴趣的可以看一下这篇文章

[《关于查看失效视频半全恢复说明》](https://btools.cc/announcement-2019-11-04/)
