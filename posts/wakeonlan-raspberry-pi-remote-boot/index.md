---
id: 445
title: wakeonlan! 树莓派远程开机
date: 2019-09-20 00:30:00
tags:
  - wakeonlan
  - 树莓派
  - 远程开机
categories:
  - 瞎研究
---

你需要对树莓派做一个内网映射，可以在外网访问树莓派以及整个局域网的设备。我用的是`frp`，但本教程并不包含内网映射

frp配置请查看[《frp内网穿透 树莓派+阿里云服务器》](/posts/506)

实现远程开机是通过一个软件，你可以用以下命令下载它

```bash
apt-get install wakeonlan
```

<!--more-->

## 使用

```bash
# wakeonlan -i [广播地址] [MAC地址] 下面是例子
wakeonlan -i 192.168.1.255 FF:FF:FF:FF:FF:FF
```

## 广播地址

一般局域网的广播地址是`192.168.X.255`，**X**位置可能会不同，根据你的内网地址的广播地址填写

## MAC地址

在windows系统中，打开CMD，输入`ipconfig /all`，找到你连接内网网卡，复制MAC地址
**注意这个地址中间是以“-”分隔的，你需要手动改成“:”**

## 目标电脑的设置

你需要开启主板的一个配置**允许PCI/PCIE设备唤醒电脑**，不同主板设置界面不同，你可以根据你的主板品牌、型号去百度**XX主板开启PCI设备唤醒**

主板设置好后再设置网卡一些属性，首先打开设备管理器或用其他方法找到网卡属性，高级里面把唤醒魔包的值设为开启

![](/uploads/2019/09/wakeonlan-1.png)

然后再点**电源管理**，都给他勾上

![](/uploads/2019/09/wakeonlan-2.png)

2020-12-02 更新，之前重装过一次电脑，发现唤醒失效了

原因是我开启了“**快速启动**”，你需要关掉

`Win+R`打开运行 -> 输入`control`打开控制面板 -> 硬件和声音 -> 电源按钮功能

把快速启动的勾去掉

![](/uploads/2019/09/wakeonlan-3.png)

## 远程开机程序

这里我用了一个PHP的网页，执行了`wakeonlan`这条命令
需要用`exec`函数去执行，如果没成功，很可能是因为这个函数比较危险，在`php.ini`里是被禁用了
解除禁用你得找到`php.ini`，搜索`disable_functions`，把`exec`或者你需要用的函数删掉，这样OK了

下面是部分PHP的源码，我也加了个密码保证只有我自己能开机，`exec`具体怎么用还请看[**官方文档**](https://www.php.net/manual/en/function.exec.php)

```php
if(!empty($_POST['pwd']) && $_POST['pwd'] == '123') {
  $shell = 'wakeonlan -i 192.168.1.255 FF:FF:FF:FF:FF:FF';
  exec($shell, $result, $status);
  // 也可以直接
  // exec('wakeonlan -i 192.168.1.255 FF:FF:FF:FF:FF:FF');
}
```

全部代码

```php
<?php
  header("Content-type:text/html;charset=utf-8");

  if(isset($_POST['pwd'])) {

    if(!empty($_POST['pwd']) && $_POST['pwd'] == '123') {
      $shell = 'wakeonlan -i 192.168.1.255 FF:FF:FF:FF:FF:FF';
      exec($shell, $result, $status);
      echo '<hr>';
      var_dump($a);echo '<br>';
      var_dump($result);echo '<br>';
      var_dump($status);echo '<br>';
      $shell = "<font color='red'>etherwake</font>";
        echo "<pre>";
        if( $status ){
            echo "shell命令{$shell}执行失败<hr>";
            print_r( $result );
        } else {
            echo "shell命令{$shell}成功执行<hr>";
            print_r( $result );
        }
        echo "</pre>";
    }
    return 0;
  }
?>

<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>biu</title>
  <style>
    .etherwake {
      margin-top: 50px;
      text-align: center;
    }
    .etherwake #pwd {
      padding-left: 5px;
      width: 200px;
      height: 30px;
      font-size: 26px;
      border: none;
      border-bottom: 1px #000 solid;
      outline:none;
    }

    #etherwake_btn {
      margin-left: 10px;
      width: 100px;
      height: 30px;
      font-size: 20px;
      background: none;
      border: 1px #000 solid;
      border-radius: 5px;
      outline:none;
    }
    #etherwake_btn:active {
      background-color: #CCC;
    }
  </style>
</head>
<body>
<div class="etherwake"><input id="pwd" type="password" ><input type="button" id="etherwake_btn" value="开机"></div>
<div id="msg"></div>
</body>
<script src="https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js"></script>
<script>
  $(function() {
    $('#etherwake_btn').click(function() {
      $.ajax({
        url: 'index.php',
        type: 'POST',
        data: {
          'pwd': $('#pwd').val()
        },
        success: function(response) {
          $('#msg').html(response);
        }
      });
    });
  });
</script>
</html>
```
