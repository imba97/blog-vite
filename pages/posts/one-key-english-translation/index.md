---
id: 644
title: 一键英译中
date: 2020-06-12 19:28:58
tags:
  - javascript
  - 翻译
  - 英译中
categories:
  - JavaScript
---

# 服务端

如果到时候用的人多了我可能会停掉。

<!--more-->

以下源码，可自行复制放在自己的服务器上，再把上面`javascript`中的`https://bili.imba97.com/translate.php`改成你的。

```php
<?php

header('content-type:application/json;charset=utf-8');
header('Access-Control-Allow-Origin: *');

function curlRequest($ipUrl) {

    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $ipUrl);
    curl_setopt($curl, CURLOPT_HEADER, 0);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($curl, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows; U; Windows NT 5.2) AppleWebKit/525.13 (KHTML, like Gecko) Chrome/0.2.149.27 Safari/525.13');
    $resultData = curl_exec($curl);
    curl_close($curl);

    return $resultData;

}

$kw = rawurlencode($_GET['kw']);

$data = curlRequest('https://translate.google.cn/translate_a/single?client=gtx&dt=t&dj=1&ie=UTF-8&sl=auto&tl=zh_CN&q=' . trim($kw));

echo $data;
```
