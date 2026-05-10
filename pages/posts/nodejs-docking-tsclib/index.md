---
id: 771
title: Nodejs 对接 TSCLIB
date: 2023-11-27 20:33:46
tags:
  - TSC
  - 打印
categories:
  - 工作
---

# 开始

最近工作中有这么个课题。曾几何时我基于 `electron` 做了个打印功能，按照官网文档的描述，原理其实是 `electron` 启动一个渲染进程，加载一个网页，并且调用 `electron` 给的打印函数实现打印

这种方式其实就是打印网页，但后面发现推到 Windows 打印队列中的数据比较大，有 `300` 到 `500` KB，相比友商足足大了 `100` 倍！

于是又被派来研究一下友商的解决方案，友商的解决方案也很容易猜到，其实就是推送了打印指令，而不是整个网页的渲染物

虽说容易猜到，但实际调研过程还是困难重重，但这篇文章就不展开说了，直奔主题

# TSCLIB

TSCLIB 是个打印机函数库，它提供了一些基础的打印封装，并提供了推送二进制数据的方法

根据 [官方文档](https://fs.chinatsc.cn/system/files/tsc_dll_instruction_c.pdf) 描述，你可以调用 `TSCLIB.dll` 中封装的函数来实现打印

这就引出第二个问题，`nodejs` 如何调用 `dll`

# 调用 DLL

使用 `ffi-napi` 和 `ref-napi` 这两个开源库，能做到 `nodejs` 调用 `dll` 中的方法

首先将你用到的函数，函数名、返回值类型、参数类型一一声明

```javascript
import ffi from 'ffi-napi'
import ref from 'ref-napi'

const tsclib = ffi.Library('TSCLIB.dll', {
  openport: [ref.types.int, [ref.types.CString]],
  clearbuffer: [ref.types.void, []],
  printlabel: [ref.types.void, [ref.types.CString, ref.types.CString]],
  sendBinaryData: [ref.types.void, [ref.types.CString, ref.types.long]],
  closeport: [ref.types.void, []]
})
```

然后是使用，参考文档第 8 页的调用案例

开启打印端口，`printer name` 就是 Windows 中打印机驱动的名称

```javascript
tsclib.openport('printer name')
```

清除缓冲区数据

```javascript
tsclib.clearbuffer()
```

构造打印数据，直接丢进去一个 `byte` 数组

```javascript
const data = Buffer.from(byteArray)
tsclib.sendBinaryData(data, data.length)
```

设置打印版数、份数

```javascript
tsclib.printlabel('1', '1')
```

关闭端口

```javascript
tsclib.closeport()
```

# 通关

最后你就会看到，一个小到 3KB 的打印任务出现在 Windows 打印队列里

![](/uploads/2023/11/nodejs-tsclib-1.png)
