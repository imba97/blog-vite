---
id: 738
title: 请求接口类的封装
date: 2021-01-19 00:33:46
tags:
  - C#
  - typescript
categories:
  - 瞎研究
---

# 简述

最开始知道这个方法是在公司一位大佬的代码里看到的，语言是`TypeScript`，当时感觉这个写法逻辑非常清晰，阅读极度舒适

后来又根据自己的需要加了参数类型约束，用在了一个浏览器插件项目中：[Btools-vue](https://github.com/imba97/Btools-vue/blob/d13bc99a72866bc6dd604bfb5097e2e52bb01ec2/src/scripts/base/Url.ts)（但在后来的一次[重构](https://github.com/imba97/Btools-vue/commit/51785e9de75019057e217f18cec2e0ab7c0c942d)中删掉了）

并且也在目前在做的`Unity`游戏中，用`C#`写了一个类似的，用起来也是非常舒适

<!--more-->

# 使用

先演示一下使用方式

## TypeScript

Url 类

<!-- eslint-disable import/no-named-default -->
```typescript
import { RequestOptions } from 'node:https'
import { ParsedUrlQueryInput, default as qs } from 'node:querystring'
import { AxiosRequestConfig } from 'axios'
import Vue from 'vue'

/**
 * URL 类型
 */
export enum UrlType {
  BILIBILI,
  IMBA97
}

/**
 * 请求类型
 */
export enum MethodType {
  GET,
  POST
}

export class Url<T extends ParsedUrlQueryInput> {
  private _bilibili_base_url = 'https://api.bilibili.com'

  private _imba97_base_rul = 'https://bili.imba97.cn'

  public static readonly enums: Url<any>[] = []

  public static readonly headers: { [key: string]: { [key: string]: string } } = {}

  // ========= BILIBILI =========

  // 获取用户卡片信息
  public static readonly USER_CARD: Url<{ mid: string }> = new Url(MethodType.GET, UrlType.BILIBILI, '/x/web-interface/card', null)

  public static readonly LIKE: Url<{ aid: number, like: number, csrf: string }> = new Url(MethodType.POST, UrlType.BILIBILI, '/x/web-interface/archive/like', {
    Referer: 'https://www.bilibili.com',
    Origin: 'https://www.bilibili.com'
  })

  // ========= 测试 =========

  // 测试
  public static readonly POST_TEST: Url<{ param: string | number }> = new Url(MethodType.POST, UrlType.IMBA97, '/postTest.php', null)

  constructor(private _method: MethodType, private _type: UrlType, private _path: string, private _headers: any) {
    if (this._headers !== null)
      Url.headers[this.url] = this._headers
    Url.enums.push(this)
  }

  get baseUrl(): string {
    // 根据 type 获取 baseUrl
    switch (this._type) {
      case UrlType.BILIBILI:
        return this._bilibili_base_url

      case UrlType.IMBA97:
        return this._imba97_base_rul

      default:
        throw new Error('未曾设想的 URL 类型')
    }
  }

  get path(): string {
    return this._path
  }

  get url(): string {
    return `${this.baseUrl}${this._path}`
  }

  get method(): string {
    switch (this._method) {
      case MethodType.GET:
        return 'GET'
      case MethodType.POST:
        return 'POST'
      default:
        throw new Error('未曾设想的请求类型')
    }
  }

  public request(params?: T, options?: AxiosRequestConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      Vue.chrome.runtime.sendMessage({
        type: this.method,
        url: this.url,
        ...(this._method === MethodType.GET ? { params } : { data: qs.stringify(params) }),
        headers: this._method === MethodType.GET ? { } : { 'content-type': 'application/x-www-form-urlencoded' },
        ...options
      }, (json) => {
        if (!json)
          reject(new Error('error'))
        resolve(json)
      })
    })
  }
}
```

声明一个新接口的格式是

`public static readonly 名称: Url<{ 发送参数名: 发送参数类型 }> = new Url(请求类型, URL类型, 'URL路径', RequestHeaders)`

`request`函数是根据插件开发需要做了封装，普通网页的话直接在里面写请求代码就好

使用时

```typescript
Url.USER_CARD.request({
  mid: '2198461'
}).then((json) => {
  console.log(json)
})
```

可以在这个类中声明所有请求用的URL，并且用泛型指定参数类型

用的时候会有代码提示，可以明确知道调用这个接口需要传哪些参数

![](/uploads/2021/01/url-1.png)

## C#

`C#`的文件比较多，一个一个来说

首先是跟上面类似的Url类

```csharp
using System;
using System.Reflection;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;

/// <summary>
/// 请求类型
/// </summary>
public enum MethodType
{
  GET,
  POST
}

/// <summary>
/// URL 类型
/// </summary>
public enum UrlType
{
  /// <summary>
  /// 测试用接口
  /// </summary>
  TEST,
  TEST2
}

public class Url
{
  /// <summary>
  /// POST_TEST 测试 POST 请求用
  /// </summary>
  /// <typeparam name="Param.POST_TEST">参数类型约束</typeparam>
  /// <typeparam name="Responses.POST_TEST">返回值类型约束</typeparam>
  public static readonly Url<Params.POST_TEST, Responses.POST_TEST> POST_TEST = new Url<Params.POST_TEST, Responses.POST_TEST>(MethodType.POST, UrlType.TEST, "/postTest.php");
  public static readonly Url<Params.POST_TEST_COMPLEX, Responses.POST_TEST_COMPLEX> POST_TEST_COMPLEX = new Url<Params.POST_TEST_COMPLEX, Responses.POST_TEST_COMPLEX>(MethodType.POST, UrlType.TEST, "/postTest.php");
}

public class Url<TParam, TResponse> : Url where TParam : Params.ParamBase
{

  private MethodType _method;
  private UrlType _type;
  private string _path;

  public static readonly Dictionary<string, Url<TParam, TResponse>> enums = new Dictionary<string, Url<TParam, TResponse>>();

  public Url(MethodType method, UrlType type, string path)
  {
    this._method = method;
    this._type = type;
    this._path = path;
    enums.Add(typeof(TParam).ToString().Replace("Param.", ""), this);
  }

  public string GetUrl()
  {
    return string.Format("{0}{1}", this.GetBaseUrl(), this._path);
  }

  public void Request(TParam data, UnityAction<TResponse> success, UnityAction<string> error)
  {
    RequestManager.Instance.Send<TResponse>(this.GetMethod(), this.GetUrl(), this.ToRequestParams(data), success, error);
  }

  public void Request(TParam data, UnityAction<TResponse> success)
  {
    RequestManager.Instance.Send<TResponse>(this.GetMethod(), this.GetUrl(), this.ToRequestParams(data), success);
  }

  private string GetBaseUrl()
  {
    switch (this._type)
    {
      case UrlType.TEST:
        return "https://bili.imba97.cn";
      case UrlType.TEST2:
        return "https://xxx";
      default:
        throw new Exception("未曾设想的 URL 类型");
    }
  }

  private string GetMethod()
  {
    switch (this._method)
    {
      case MethodType.GET:
        return "GET";
      case MethodType.POST:
        return "POST";
      default:
        throw new Exception("未曾设想的请求类型");
    }
  }

  /// <summary>
  /// 将参数类封装为请求参数字典
  /// </summary>
  /// <param name="data">参数类</param>
  /// <returns>请求参数字典</returns>
  private Dictionary<string, string> ToRequestParams(TParam data)
  {
    Dictionary<string, string> dict = new Dictionary<string, string>();

    // 获取参数类字段
    FieldInfo[] fields = typeof(TParam).GetFields();
    // 封装成字典
    foreach (FieldInfo field in fields)
    {
      dict.Add(field.Name, field.GetValue(data).ToString().ToLower());
    }

    return dict;
  }

}
```

声明一个新接口的格式是

`public static readonly Url<Params.参数类, Responses.返回值类> 名称 = new Url<Params.参数类, Responses.返回值类>(请求类型, URL类型, "URL路径");`

`Url<TParam, TResponse>`类继承`Url`类，接口的声明放在`Url`类中，这样调用的时候就不需要再设置泛型

参数传进来后通过`ToRequestParams()`转成一个字典，传入请求用的`RequestManager`

下面是`RequestManager`

```csharp
using System.IO;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.Events;
using Newtonsoft.Json;

public class RequestManager : SingletonBase<RequestManager>
{

  /// <summary>
  /// 发起网络请求
  /// </summary>
  /// <param name="method">请求类型</param>
  /// <param name="url">链接</param>
  /// <param name="data">参数</param>
  /// <param name="success">成功的回调</param>
  /// <param name="error">失败的回调</param>
  public void Send<TResponse>(string method, string url, Dictionary<string, string> data, UnityAction<TResponse> success, UnityAction<string> error)
  {
    MonoManager.Instance.StartCoroutine(RSendRequest<TResponse>(method, url, data, success, error));
  }

  /// <summary>
  /// 发起网络请求（不设置失败回调）
  /// </summary>
  /// <param name="method">请求类型</param>
  /// <param name="url">链接</param>
  /// <param name="data">参数</param>
  /// <param name="success">成功的回调</param>
  public void Send<TResponse>(string method, string url, Dictionary<string, string> data, UnityAction<TResponse> success)
  {
    MonoManager.Instance.StartCoroutine(RSendRequest<TResponse>(method, url, data, success, null));
  }

  /// <summary>
  /// 发起网络请求
  /// </summary>
  /// <param name="method">请求类型</param>
  /// <param name="url">链接</param>
  /// <param name="data">参数</param>
  /// <param name="success">成功的回调</param>
  /// <param name="error">失败的回调</param>
  private IEnumerator RSendRequest<TResponse>(string method, string url, Dictionary<string, string> data, UnityAction<TResponse> success, UnityAction<string> error)
  {

    string getData = "";
    WWWForm postData = new WWWForm();

    // 如果有参数 构造参数
    if (data != null && data.Count > 0)
    {
      switch (method)
      {
        case "GET":
          getData = GetQueryParams(data);
          break;

        case "POST":
          foreach (KeyValuePair<string, string> item in data)
          {
            postData.AddField(item.Key, item.Value);
          }
          break;
      }
    }

    UnityWebRequest webRequest = method == "GET" ? UnityWebRequest.Get(string.Format("{0}?{1}", url, getData)) : UnityWebRequest.Post(url, postData);

    yield return webRequest.SendWebRequest();
    //异常处理，很多博文用了error!=null这是错误的，请看下文其他属性部分
    if (webRequest.isHttpError || webRequest.isNetworkError)
    {
      if (error != null) error(webRequest.error);
    }
    else
    {
      success(JsonConvert.DeserializeObject<TResponse>(webRequest.downloadHandler.text));
    }
  }

  /// <summary>
  /// 获取 GET 参数
  /// </summary>
  /// <param name="param">参数</param>
  /// <returns>GET 参数</returns>
  public string GetQueryParams(Dictionary<string, string> param)
  {
    string data = "";
    bool frist = true;
    // 获取 key
    foreach (KeyValuePair<string, string> item in param)
    {
      string and = frist ? "" : "&";
      data = string.Format("{0}{1}{2}={3}", data, and, item.Key, item.Value);
      frist = false;
    }

    return data;
  }

}
```

这个类继承了单例，单例代码就不演示了，比较简单

功能就是进行网络请求，把返回值转成对应的返回值类传入`success`回调函数

这里的类型就是下面这个，里面指定了**参数类型**和**返回值类型**，所有的都需要自己声明

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// 参数类型约束
/// </summary>
namespace Params
{
  public class ParamBase
  {

  }

  public class POST_TEST : ParamBase
  {
    public string param;
  }

  public class POST_TEST_COMPLEX : ParamBase
  {
    public string param;
    public bool complex;
  }
}

/// <summary>
/// 返回值类型约束
/// </summary>
namespace Responses
{
  [SerializeField]
  public class ResponsesBase : ScriptableObject
  {

  }

  public class POST_TEST : ResponsesBase
  {
    public string param;
  }

  public class POST_TEST_COMPLEX
  {

    public int code;
    public string info;

    public DATA data;

    public class DATA
    {
      public string param;
      public string param2;
    }

  }
}
```

比如`Responses.POST_TEST_COMPLEX`对应的JSON是这样的

```json
{
  "code": 0,
  "info": "成功",
  "data": {
    "param": "test",
    "param2": "2333"
  }
}
```

使用时

```csharp
Url.POST_TEST_COMPLEX.Request(new Params.POST_TEST_COMPLEX()
{
  param = "测试",
  complex = true
}, (json) =>
{
  DataManager.Instance.GenerateJsonFile("test", json);
});
```

并且有完善的代码提示和类型约束

传参代码提示：

![](/uploads/2021/01/url-2.png)

传参类型约束：

![](/uploads/2021/01/url-3.png)

返回值代码提示：

![](/uploads/2021/01/url-4.png)

这里面用的JSON格式化包是[Newtonsoft.Json](https://github.com/JamesNK/Newtonsoft.Json)，比`JsonUtility`不知道要好用多少

# 结束

OK 以上就是这个请求接口类
