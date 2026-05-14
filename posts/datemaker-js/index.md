---
id: 443
title: dateMaker.js
date: 2019-09-16 00:02:23
tags:
  - dateMaker
  - javascript
categories:
  - 个人项目
---

这是[about](/about)页面中用到的一个js程序，可以根据一个起始日期计算距离当前的差值，精确到毫秒。

程序本体：由一个`dateMaker`获取数据函数和一个`time_valide`日期格式化函数组成

<!--more-->

```javascript
function dateMaker(id) {
  const dom = document.querySelector(`#${id}`)
  // 计时器间隔
  const interval_time = dom.getAttribute('interval-time') !== null ? Number.parseInt(dom.getAttribute('interval-time')) : 1000
  // 额外添加的时间，逗号隔开
  let plus_time = 0
  const plus_time_attr = dom.getAttribute('plus-time')
  const plus_time_arr = /^(?:\d+,)+\d+$/.test(plus_time_attr) ? plus_time_attr.split(',') : false
  if (plus_time_arr) {
    plus_time_arr.forEach((v, k) => {
      plus_time += Number.parseInt(v)
    })
  }
  else if (/^\d+$/.test(plus_time_attr)) {
    plus_time = Number.parseInt(plus_time_attr)
  }

  // 开始时间 字符串 比如 2019/09/11 16:42:00
  const sTime = new Date(dom.getAttribute('start-time')).getTime()

  const timer = setInterval(() => {
    const now = new Date()
    t = time_valide(sTime - plus_time, now.getTime())
    const years = t.y > 0 ? `${t.y}年` : ''
    const months = t.m > 0 ? `${t.m}个月` : t.y > 0 ? '1个月' : ''
    const days = t.d > 0 ? `${t.d}天` : t.y > 0 ? '1天' : ''
    let hours = t.h
    if (hours < 10)
      hours = `0${hours}`
    hours += '个小时'
    let mins = t.i
    if (mins < 10)
      mins = `0${mins}`
    mins += '分钟'
    let secs = t.s
    if (secs < 10)
      secs = `0${secs}`
    secs += '秒'
    let msecs = now.getMilliseconds()
    if (msecs < 10) {
      msecs = `00${msecs}毫秒`
    }
    else if (msecs >= 10 && msecs < 100) {
      msecs = `0${msecs}毫秒`
    }
    else {
      msecs += '毫秒'
    }
    dom.innerHTML = years + months + days + hours + mins + secs + msecs
  }, interval_time)
}

function time_valide(starttime, endtime) {
  const timediff = endtime / 1000 - starttime / 1000
  // 年
  const years = Number.parseInt(timediff / 31536000)
  let remain = timediff % 31536000
  // 月
  const months = Number.parseInt(remain / 2592000)
  remain %= 2592000
  // 日
  const days = Number.parseInt(remain / 86400)
  remain = remain % 86400
  // 时
  const hours = Number.parseInt(remain / 3600)
  remain = remain % 3600
  // 分
  const mins = Number.parseInt(remain / 60)
  remain = remain % 60
  // 秒
  const secs = Number.parseInt(remain % 60)

  return {
    y: years,
    m: months,
    d: days,
    h: hours,
    i: mins,
    s: secs
  }
}
```

使用时引入dateMaker.js，使用`dateMaker`并传入一个ID

```html
<span id="date" plus-time="23241600000" start-time="2018/10/16 07:00:00" interval-time="50"></span>
```

支持几个属性

- **plus-time**：额外增加的时间，单位毫秒，比如我统计工作时间，我是从2018年10月到现在在工作，并且2015年也工作了9个多月，所以我这里写“23241600000”，也就是额外增加的时间，可以添加多个，用英文逗号隔开
- **start-time**：这个不用多说，就是开始时间，年月日格式必须用斜杠“yyyy/mm/dd”，不能用减号“yyyy-mm-dd”，否则苹果手机的浏览器可能不兼容，包括苹果手机的QQ、微信内置浏览器
- **interval-time**：这是计时器的间隔时间，单位毫秒，每过多长时间运行一次，如果时间精确到秒的话写1000就OK，精确到毫秒的话得有那种飞快跑动的感觉，所以这里是50

最后会在这个`span`标签内生成“**X年X个月X天XX个小时XX分钟XX秒XXX毫秒**”
