---
id: 249
title: 在SVG中使用Javascript
date: 2019-07-30 12:44:41
tags:
  - javascript
  - svg
categories:
  - 瞎研究
---

最近研究SVG图，发现可以使用`javascript`。但SVG是XML，直接在里面写`javascript`会报错。

你需要加一个，不让XML解析的标识 <code>&lt;![CDATA[]]&gt;</code>。

<!--more-->

```xml
<svg>
  ...
  <script>
    <![CDATA[
      alert(233); // 这里面写javascript代码
    ]]>
  </script>
</svg>
```

以上类似的教程网上有不少，我主要想说：

有一点需要注意，这种js无法在`<img>`或`background-image`引用的时候运行，也就是如果SVG是个时钟，js控制着时分秒针的运动，那么这张SVG图被当做图片引用会变成一张静态图片。
