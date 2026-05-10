---
id: 776
title: 自建服务 Google Gemini
date: 2024-01-07 22:33:02
tags:
  - Google
  - AI
  - Gemini
categories:
  - 自建服务
---

以下介绍由 `Google Gemini` 生成

# Google Gemini

> 简单介绍一下 Google Gemini

Google Gemini 是谷歌公司推出的一款对话式人工智能模型，可以进行更为复杂的对话。Gemini 具有以下特点：

- **知识广博**：Gemini 拥有海量的知识，可以回答各种各样的问题。
- **对话式交互**：Gemini 可以进行对话式的交互，就像你在和人聊天一样。
- **个性化体验**：Gemini 可以根据你的喜好和兴趣来调整自己的回复，为你提供个性化的体验。
- **创造性思维**：Gemini 可以进行创造性的思维，可以生成故事、诗歌、笑话等内容。
- **强大的推理能力**：Gemini 具有强大的推理能力，可以对复杂的问题进行分析和推理，并给出合理的答案。

# 能做什么

> 你能做什么

作为人工智能语言模型，我可以做很多事情，包括：

- **回答各种问题**：我可以回答关于世界各地的历史、科学、文化、地理和其他主题的问题。
- **生成文本**：我可以生成各种形式的文本，包括故事、诗歌、文章、演讲和代码。
- **翻译语言**：我可以将文本从一种语言翻译成另一种语言。
- **总结文本**：我可以提取文本中的关键信息并提供摘要。
- **回答创意写作提示**：我可以为你提供创意写作提示，并根据你的想法生成文本。
- **回答数学问题**：我可以回答各种数学问题，包括代数、几何和微积分等。
- **生成图像**：我可以生成不同的图像，包括照片、插图和艺术品等。
- **音乐创作**：我可以创作音乐，包括旋律、和声和节奏等。
- **生成食谱**：我可以生成不同菜肴的食谱，包括食材、烹饪方法和烹饪时间等。
- **生成代码**：我可以生成不同编程语言的代码，包括 Python、Java、C++ 等。

---

这里开始就是我开始表演了

其实跟 `Chat GPT` 一样，就是个大语言模型。API 提供免费版，1分钟限制 60 次请求，对于个人用户再带几个朋友一起用也完全够用

# API KEY 获取

首先需要科学上网到 [支持的地区](https://ai.google.dev/available_regions?hl=zh-cn)，不然打不开申请页面。选择好地区后打开 [申请页面](https://ai.google.dev/)，点击创建即可

![](/uploads/2024/01/gemini-1.png)

# 部署

部署网页程序：[babaohuang/GeminiProChat](https://github.com/babaohuang/GeminiProChat)

支持很多平台的一键部署，但我是部署在软路由上。所以这里我用的 `Docker`，首先写个 `docker-compose.yml`

```yml
version: '3'
services:
  geminiprochat:
    image: babaohuang/geminiprochat:latest
    ports:
      # 宿主机端口:容器端口
      - '3000:3000'
    restart: always
    environment:
      GEMINI_API_KEY: API_KEY
```

填好你的 `GEMINI_API_KEY`，如果需要其他参数参考上面的文档

跑起来后你就能看到

<img src="/uploads/2024/01/gemini-2.png" style="zoom:50%;" />

# 试一下

刚好公司要写年终述职报告，基本上再简单改改就能用

<img src="/uploads/2024/01/gemini-3.png" style="zoom:50%;" />
