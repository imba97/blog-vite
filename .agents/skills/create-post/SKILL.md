---
name: create-post
description: 在 posts 下创建新文章并自动生成 frontmatter 元数据。用于用户提到创建新文章、新建 post、根据标题初始化文章时。
disable-model-invocation: true
---

# 创建文章

## 目标

创建 `posts/<slug>/index.md`，并自动生成 frontmatter：
- `id`：现有文章最大 id + 1
- `title`：用户提供的原始标题
- `date`：当前时间
- `tags`：默认一个空项
- `categories`：默认一个空项

正文默认留空。

## 工作流

1. 确认标题：
   - 若用户已提供标题，直接使用。
   - 若未提供标题，先向用户询问标题。

2. 在调用脚本前生成 slug：
   - 将标题翻译为简洁英文。
   - 去除标点符号。
   - 使用 `-` 连接单词。
   - 转成小写。
   - 保持简洁且语义清晰。

3. 传入明确参数执行脚本：
   - `--title` 使用用户原始标题。
   - `--slug` 使用翻译并清洗后的英文 slug。
   - 脚本会校验 slug 格式与长度（`<= 50`）。

4. 返回结果：
   - 返回创建的文件路径。
   - 返回生成的 `id` 和 `date`。

## 执行命令

使用 `esno` 执行：

```bash
pnpm run post:new -- --title "<original title>" --slug "<english-slug>"
```

## 输出格式要求

生成的 `index.md` 必须为：

```md
---
id: <自动递增 id>
title: <用户标题>
date: <当前时间>
tags:
  -
categories:
  -
---
```
