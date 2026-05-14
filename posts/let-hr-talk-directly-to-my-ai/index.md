---
id: 801
title: 让 HR 直接跟我的 AI 聊
date: 2025-04-26 20:40:18
tags:
  - AI
  - 简历
categories:
  - 个人项目
---

# 做个自我介绍

![](/uploads/2025/04/imba97-ai-1.gif)

做了个求职偷懒 AI，基于我的简历数据的聊天，目前感觉有不少场景都可以用上

- 比如直接发给 HR
- 比如直接复制工作要求让 AI 给出匹配程度
- 可以自己跟 AI 聊聊，学习参考 AI 的回答技巧

# 技术细节

AI 是 DeepSeek，并使用了 [one-api](https://github.com/songquanpeng/one-api)，直接用 <span icon text="#2396ed" i-mdi-docker></span> Docker 跑起来

它可以整合各种 AI 接口，统一成 ChatGPT 的格式，便于之后切换 AI

也算是摸清了流式输出和 SSE 格式处理

# 网站

有兴趣可以体验一下 [imba97.me/ai](https://imba97.me/ai)

代码可参考开源项目 <span icon i-mdi-github></span> [imba97/me](https://github.com/imba97/me)
