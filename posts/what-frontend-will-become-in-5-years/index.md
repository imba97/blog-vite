---
id: 816
title: 五年内的前端会变成什么？
date: 2026-06-24 02:44:33
tags:
  - AI
  - 前端
  - 想法
categories:
  - 个人项目
---

# 引言

AI 不断地覆盖到我们生活的方方面面，你会发现大部分应用界面都有 AI 入口。但是，更多的用户依然使用传统页面，打开 AI 聊天要么是尝鲜，要么是有人“请客”

那么，为什么我们不会去使用 AI 入口？为什么怒砸 30 亿“请客”却成了小丑？

# 现状分析

AI 非常适合即时聊天类，你发文字，它回复文字。只回复文字的样式排版不好看，所以它会天然与 Markdown 结合

但如果想把它跟业务结合，现在普遍的形式是，预设一些业务场景专用组件。用咖啡小程序举例子，用户说“点杯咖啡”、“查看优惠”等，AI 会返回一个特定组件，我称之为“**预制组件**”，这就会让 AI 的能力被大幅度削弱

大家可以尝试说一句“我想修改手机号”，我试过绝大多数的应用都没法直接达成我的预期，而是搬出文档，指导我进入哪个常规页面去修改

# 直奔主题

> 五年内的前端会变成什么？

![](/uploads/2026/06/what-frontend-will-become-in-5-years-1.png)

我们为什么不把“预制组件”变成“**现炒组件**”呢？

![](/uploads/2026/06/what-frontend-will-become-in-5-years-2.png)

如 Demo 所示，把应该要渲染什么组件，交还给 AI 来决定。准确的说应该是，**让 AI 来生成基于精准用户意图的组件**

那么，大家的疑问是：为什么我不直接说“把昵称修改成 imba久期”呢？

这其实是不冲突的，作为应用开发者，我只需要把“**应用的能力**”封装起来并提供给 AI，那么 AI 判断到用户意图已经明确了，就可以直接调用应用能力完成修改。但如果用户意图并不明确，那么 AI 还可以自行调用生成特定组件来让用户自己操作

本质上来说就是把用户原本需要深入几层页面找的功能，直接端了上来

# 原子化组件

我认为，从现在到未来的 AI 超级入口之间，还有一步必须要走的就是**原子化组件**，将组件拆成最小单元，交给 AI 来基于用户意图进行组合

这套组件是一个空壳，没有任何逻辑和样式，但它可以去附着任何逻辑和样式，这也会交由 AI 来决定。那么到了最关键的点，就是如何让 AI 去实现任意交互逻辑和样式呢？

# Triggerix

终于来到了最近我在做的一个项目 {link:github:triggerix-collective/triggerix}，读音与 Trigger `[ˈtrɪɡər]` 一致

它借鉴了《魔兽争霸 Ⅲ》地图编辑器的**触发器**概念，通过**事件**、**条件**、**动作**三种元素来实现任意交互逻辑。老粉都知道，我最早是做魔兽地图编辑器教程视频的，为了情怀我还实现了一个 Web 交互触发器 Demo

![](/uploads/2026/06/what-frontend-will-become-in-5-years-3.png)

简单来说它的作用就是，定义“按钮点击事件”、“修改昵称动作”、“修改性别动作”等基于业务逻辑的最小单元，并可以在 Runtime 阶段自由组合

> 有多自由呢？

![](/uploads/2026/06/what-frontend-will-become-in-5-years-4.png)

点开来看

![](/uploads/2026/06/what-frontend-will-become-in-5-years-5.png)

也就是当事件“左侧轮播切换”触发时，将右侧轮播切换到第几张呢，是获取的左侧轮播的索引值，这样就实现了轮播联动

大家可以尝试把左右调换，此时就成了右侧轮播切换时，带动左侧轮播同步

# 展望

| 层 | 对应项目 | 职责 | 协议格式 |
|---|---|---|---|
| 组件框架（骨骼） | `@triggerix-ai/component`、`triggerix-ai-component-native`、未来的 atom component | UI 结构：有哪些组件、如何组合 | JSON Schema |
| **Triggerix（肌肉）** | `triggerix/*`、`triggerix-editor-*`、`triggerix-collective.github.io` | 交互行为：事件、条件、动作 | ECA trigger schema |
| Shinix（皮肤） | （规划中） | 视觉表现：颜色、间距、动画、布局 | Style schema |

三层完全独立，都用 JSON Schema 表达，并通过统一的 Runtime 解析与执行

# 开源

当前还是 Demo 阶段，有兴趣的话欢迎参与，一起实现 AI 时代下该有的前端界面

Github 组织：[https://github.com/triggerix-collective](https://github.com/triggerix-collective)

Demo 站：[https://triggerix.netlify.app](https://triggerix.netlify.app)
