---
id: 724
title: Unity UI 管理模块
date: 2020-11-27 14:48:03
tags:
  - UI
  - Unity 3D
categories:
  - 个人项目
---

# 前言

本教程是在B站UP“[一唐老狮一](https://space.bilibili.com/79983517)”的视频教程 [《Unity的程序基础框架》](https://www.bilibili.com/video/BV1C441117wU) 中，**UI管理模块**的改进。

因为UP这个教程变成了付费课程，如果想看代码是怎么写的，可以去支持[付费课程](https://www.taikr.com/course/1062)

或者这篇文章，是别人的笔记： [《Unity3D程序基础框架（下）》](https://blog.csdn.net/m0_46378049/article/details/106180496) 中的“**UI管理模块**”部分

<!--more-->

# 主要功能

1. 统一管理当前面板下的控件（按钮、图片、文本框等）
2. UI分层
3. 反射型事件监听

其中对原版的改进部分主要是反射型事件监听（我瞎起的名，不知道有没有专业名词），我不太确定这么做会不会有性能问题，还请大佬指教（在视频评论）

这个东西的作用是你在使用按钮等控件时，可以直接在对应的面板类里写方法

比如我有一个面板，上面有几个控件，分别是名叫`btnTest`和`btn2`的两个按钮和名叫`Test`的复选框

![](/uploads/2020/11/unity-ui-manager-1.png)

我只需要写一个类，继承`BasePanel`类，其他任何复杂的东西都不需要

就可以直接在这个面板类里写`控件名+OnClick`和`控件名+OnValueChanged`即可分别监听对应名称的按钮点击事件和复选框切换事件

代码：

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class LoginPanel : BasePanel
{
  public void btnTestOnClick()
  {
    Debug.Log("Click!!!");
  }

  public void btn2OnClick()
  {
    Debug.Log("btn2 Click!!!");
  }

  public void TestOnValueChanged(bool value)
  {
    Debug.Log(value);
  }
}
```

效果演示：

![](/uploads/2020/11/unity-ui-manager-2.gif)

如果有其他事件监听，可以添加更多

# 教程

除了反射型事件监听这个功能，其实整个UI部分还包括很多，我们一个个来看

## CanvasManager

画布管理器，因为UI的所有东西都需要`Canvas`和`EventSystem`，你可以把这两个东西拿出来，分别作为预制体

在`Canvas`里创建几个空物体，用于实现分层

![](/uploads/2020/11/unity-ui-manager-3.png)

Bot、Mid、Top、Sys分别是底层、中层、顶层、系统层

UI分层的意义很好理解，举个例子。我有一个装备栏把它放在底层，鼠标放在装备上弹出装备信息，我需要显示在物品栏上层，点击物品信息的分解装备按钮弹出“是否确认分解”提示框，需要放在更上层

为了更方便的使用，我把这些统一放在了`CanvasManager`中

```csharp
using System;
using System.Collections;
using UnityEngine;

public enum UI_Layer
{
  BOT,
  MID,
  TOP,
  SYS
}

public class CanvasManager : SingletonMonoBase<CanvasManager>
{

  private Transform _canvas;

  private Transform _bot;
  private Transform _mid;
  private Transform _top;
  private Transform _sys;

  public void Awake()
  {

    DontDestroyOnLoad(gameObject);
    // 加载 Canvas 预制体
    GameObject obj = AssetBundleManager.Instance.Load<GameObject>("ui", "Canvas");
    _canvas = obj.transform;
    // 找到层
    _bot = _canvas.Find("Bot");
    _mid = _canvas.Find("Mid");
    _top = _canvas.Find("Top");
    _sys = _canvas.Find("Sys");
    // 加载 EventSystem 预制体
    obj = AssetBundleManager.Instance.Load<GameObject>("ui", "EventSystem");

  }

  /// <summary>
  /// 获取画板
  /// </summary>
  /// <returns>画板</returns>
  public Transform GetCanvas()
  {
    return _canvas;
  }

  /// <summary>
  /// 获取层对象
  /// </summary>
  /// <param name="layer">层类型</param>
  /// <returns>层对象</returns>
  public Transform GetLayer(UI_Layer layer)
  {

    switch (layer)
    {
      case UI_Layer.BOT:
        return _bot;
      case UI_Layer.MID:
        return _mid;
      case UI_Layer.TOP:
        return _top;
      case UI_Layer.SYS:
        return _sys;
    }

    return null;
  }

  /// <summary>
  /// 给 UI 设置层
  /// </summary>
  /// <param name="obj">GameObject</param>
  /// <param name="layer">层类型</param>
  public void SetLayer(GameObject obj, UI_Layer layer)
  {
    obj.transform.SetParent(GetLayer(layer));
  }

  /// <summary>
  /// 给 UI 设置层
  /// </summary>
  /// <param name="obj">Transform</param>
  /// <param name="layer">层类型</param>
  public void SetLayer(Transform obj, UI_Layer layer)
  {
    obj.SetParent(GetLayer(layer));
  }
}
```

## BasePanel

这是面板基类，其他面板需要继承这个类

作用是找到面板下的控件并储存起来、给控件添加事件监听

```csharp
using System;
using System.Text.RegularExpressions;
using System.Reflection;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;

public abstract class BasePanel : MonoBehaviour
{

  private Dictionary<string, Dictionary<int, UIBehaviour>> _ui = new Dictionary<string, Dictionary<int, UIBehaviour>>();

  private void Awake()
  {
    FindChildrenControl<Button>();
    FindChildrenControl<Image>();
    FindChildrenControl<Text>();
    FindChildrenControl<Toggle>();
    FindChildrenControl<Slider>();
    FindChildrenControl<ScrollRect>();
  }

  /// <summary>
  /// 查找组件
  /// </summary>
  /// <typeparam name="T">组件</typeparam>
  private void FindChildrenControl<T>() where T : UIBehaviour
  {

    string dictName = typeof(T).ToString();

    T[] controls = this.GetComponentsInChildren<T>();

    for (int i = 0; i < controls.Length; i++)
    {
      string name = controls[i].gameObject.name;

      // 添加按钮点击的监听
      if (controls[i] is Button)
      {
        Button btn = controls[i] as Button;
        btn.onClick.AddListener(() =>
        {
          RegisterButtonOnClick(name);
        });
      }
      // 添加单选框值变化的监听
      else if (controls[i] is Toggle)
      {
        Toggle tog = controls[i] as Toggle;
        tog.onValueChanged.AddListener((value) =>
        {
          RegisterToggleOnValueChanged(name, value);
        });
      }

      if (_ui.ContainsKey(name))
      {
        _ui[name].Add(controls[i].GetInstanceID(), controls[i]);
        return;
      }

      _ui.Add(name, new Dictionary<int, UIBehaviour>() { { controls[i].GetInstanceID(), controls[i] } });

    }
  }

  /// <summary>
  /// 按钮点击 注册事件
  /// </summary>
  /// <param name="name">组件名</param>
  protected void RegisterButtonOnClick(string name)
  {
    ExecutionEvent(name, null, UIEventType.BUTTON_ON_CLICK);
  }
  /// <summary>
  /// 单选框改变 注册事件
  /// </summary>
  /// <param name="name">组件名</param>
  /// <param name="value">单选框的值</param>
  protected void RegisterToggleOnValueChanged(string name, bool value)
  {
    ExecutionEvent(name, new List<object> { value }, UIEventType.TOOGLE_ON_VALUE_CHANGED);
  }

  /// <summary>
  /// 组件事件的执行函数，用反射调用组件所在的面板的面板类中的方法
  /// </summary>
  /// <param name="panelClass">面板类</param>
  /// <param name="name">组件名</param>
  /// <param name="parametors">参数</param>
  /// <param name="eventType">事件类型</param>
  protected void ExecutionEvent(string name, List<object> parametors, UIEventType eventType)
  {

    // 参数
    if (parametors == null) parametors = new List<object>();

    // 查找控件名是否带数字
    Match match = Regex.Match(name, @"(.*)_(\d+)$");
    string num = match.Groups[2].ToString();

    // 事件名
    string eventName = null;
    switch (eventType)
    {
      case UIEventType.BUTTON_ON_CLICK:
        eventName = "OnClick";
        break;

      case UIEventType.TOOGLE_ON_VALUE_CHANGED:
        eventName = "OnValueChanged";
        break;
    }

    // 面板类的类型
    Type panelClassType = this.GetType();

    // 方法名
    string methodName = name + eventName;

    // 如果有数字
    if (num != "")
    {
      // 改变方法名 变成 “控件名+事件名+N”
      methodName = match.Groups[1].ToString() + eventName + "N";
      // 并传回第几个按钮被点击
      parametors.Add(int.Parse(num));

    }

    // 获取方法
    MethodInfo method = panelClassType.GetMethod(methodName);

    // 如果存在 则让对应的类执行方法
    if (method != null) method.Invoke(this, parametors.ToArray());

  }

}
```

## UIManager

这里是UI管理器，可以缓存面板类、显示隐藏面板、获取面板类

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public class UIManager<T> : SingletonBase<UIManager<T>> where T : BasePanel<T>
{

  /// <summary>
  /// 面板字典
  /// </summary>
  /// <typeparam name="string">面板类型名称</typeparam>
  /// <typeparam name="T">面板</typeparam>
  /// <returns></returns>
  private Dictionary<string, T> _panel = new Dictionary<string, T>();

  /// <summary
  /// 显示面板
  /// </summary>
  /// <param name="layer">要显示到的层</param>
  /// <param name="callback">回调</param>
  public void ShowPanel(UI_Layer layer, UnityAction<T> callback)
  {

    string panelName = typeof(T).ToString();

    if (_panel.ContainsKey(panelName))
    {
      _panel[panelName].gameObject.SetActive(true);

      if (callback != null) callback(_panel[panelName]);

      return;
    }

    AssetBundleManager.Instance.LoadAsync<GameObject>("ui", panelName, (obj) =>
    {

      Transform parent = CanvasManager.Instance.GetLayer(UI_Layer.BOT);

      switch (layer)
      {
        case UI_Layer.MID:
          parent = CanvasManager.Instance.GetLayer(UI_Layer.MID);
          break;

        case UI_Layer.TOP:
          parent = CanvasManager.Instance.GetLayer(UI_Layer.TOP);
          break;

        case UI_Layer.SYS:
          parent = CanvasManager.Instance.GetLayer(UI_Layer.SYS);
          break;
      }

      obj.transform.SetParent(parent);

      // 设置相对位置和大小

      obj.transform.localPosition = Vector3.zero;
      obj.transform.localScale = Vector3.one;

      RectTransform objRect = obj.transform as RectTransform;

      objRect.offsetMax = Vector2.zero;
      objRect.offsetMin = Vector2.zero;

      T panel = obj.GetComponent<T>();

      if (callback != null)
      {
        callback(panel);
      }

      _panel.Add(panelName, panel);

    });

  }

  /// <summary>
  /// 隐藏面板
  /// </summary>
  public void HidePanel()
  {

    string panelName = typeof(T).ToString();

    if (_panel.ContainsKey(panelName))
    {
      _panel[panelName].gameObject.SetActive(false);

      return;
    }

  }

  /// <summary>
  /// 获取面板
  /// </summary>
  /// <returns>面板</returns>
  public T GetPanel()
  {
    string panelName = typeof(T).ToString();

    if (_panel.ContainsKey(panelName))
    {
      return _panel[panelName];
    }

    return null;
  }

}
```

最后新建各种面板类，继承面板基类，上面那个`LoginPanel`就是其中一个面板

# 后言

至于`SingletonBase`和`SingletonMonoBase`是什么，可以去唐老狮那个基础视频中第三节看（免费的）

作用是单例模式和继承`MonoBehaviour`的单例模式
