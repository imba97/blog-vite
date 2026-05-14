---
id: 661
title: 生成拖拽安装
date: 2020-07-19 15:13:30
tags:
  - javascript
  - 生成拖拽安装
categories:
  - javascript
---

将下面的按钮拖拽到收藏夹：

<a id="code_a" alt="生成拖拽安装" href="javascript:void(0);" cursor-move @click.stop.prevent>生成拖拽安装</a>

<!--more-->

再去选择你喜欢的程序：

[Github](https://github.com/imba97/js)

[Gitee](https://gitee.com/imba97/js)

对应的视频：[BV1Z5411Y7ko](https://www.bilibili.com/video/BV1Z5411Y7ko)

<!-- TODO: 生成 a 标签 href -->
<!-- eslint-disable -->
```javascript
javascript:if(document.querySelector(".koe_42_a")===null){var koe_is_github=/github/.test(window.location.href);var koe_42_code=koe_is_github?document.querySelector("#read-only-cursor-text-area").value:document.querySelector(".highlight .line").innerText.replace(/[\r\n]$/,"");var koe_42_style=document.createElement("style");koe_42_style.innerText=".koe_42_a { position:absolute;top:7px;left:200px;width:100px;height:30px;line-height:30px;text-align:center;background-color:#24aee6;cursor:move;font-size:0;border-radius:5px;text-decoration:none !important;z-index:999999; } .koe_42_a::before { content:'拖到收藏夹';font-size:16px;color:#FFF; }";document.head.appendChild(koe_42_style);var koe_42_a=document.createElement("a");koe_42_a.setAttribute("class","koe_42_a");var koe_42_data=JSON.parse(/\/\*(\{.*\})\*\//.exec(koe_42_code)[1]);koe_42_a.innerText=koe_42_data.name;koe_42_a.href="javascript:"+koe_42_code;if(koe_is_github){koe_42_a.setAttribute("style","position: unset;");document.querySelector('[data-testid="latest-commit"]').appendChild(koe_42_a)}else{document.querySelector(".file_holder").appendChild(koe_42_a)}}
```
