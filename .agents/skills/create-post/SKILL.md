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
- `description`：SEO/GEO 摘要（OG description / JSON-LD description 必填）
- `tags`：默认一个空项
- `categories`：默认一个空项
- `keywords`：默认一个空项

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

4. 写正文时遵循 GEO 写作建议（见下文）。

5. 返回结果：
   - 返回创建的文件路径。
   - 返回生成的 `id` 和 `date`。
   - 提醒作者补 `description` / `tags` / `categories` / `keywords`。

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
description:
tags:
  -
categories:
  -
keywords:
  -
---
```

## 正文写作的 GEO 建议

落地到 KDD 2024《GEO: Generative Engine Optimization》论文实证有效的做法（参见阿里云开发者社区《GEO 怎么做》技术解读）。下列原则在写正文时遵循，能显著提高文章被 AI 引用为来源的概率：

### 开头 50–100 字直接给结论

不要"今天我们来聊聊……"。首段就要回答"这篇文章解决什么问题、最终结论是什么"，让 LLM 的检索→摘要链路直接拿到答案。

✅ `本文用 Vue 3 + Vite 重建个人博客，重点解决了搜索索引在 SSG 阶段的内存峰值问题，最终包体控制在 320 KiB。`
❌ `最近想把博客重构一下，于是就有了这篇文章……`

### 量化事实优先

"支持 12 种模型"比"支持多种模型"更可提取。涉及版本号、性能数字、命令参数时，显式写出。

### 加入引用与一手资料

引用官方文档、RFC、GitHub Issue、PR 时用 `<blockquote>` 包起来，附完整链接。LLM 极度偏好带 URL 的显式来源。

### 用结构替代散文

- 比较表格优于段落比较
- 列表优于长句
- 结论性句子另起一行

### 长文末尾加 FAQ

用 markdown：

```md
## 常见问题

### Q1：xxx 怎么解决？

直接答案写在第一句，不要先铺垫。
```

### frontmatter 必填项

- `description`：50–160 字，写文章要解决的具体问题与最终结论。喂给 OG description / JSON-LD description / RSS。
- `tags`：3–6 个标签。
- `categories`：分类。
- `keywords`（可选）：5–10 个搜索关键词，喂给 JSON-LD `keywords`。

### 多载体一致性

若文章里提到版本号、授权方式、命令参数，必须确保 README、官方文档、相关 PR 里口径一致——RAG 交叉验证会做一致性核对，不一致会被降权或不引用。

## 发布后

- 文章修改后更新 `updated` 字段（喂给 JSON-LD `dateModified` 与 sitemap `lastmod`）。
- 跑一次 `pnpm run generate-llms` 与 `pnpm run generate-sitemap` 本地校验。
- 提交后 Vite 插件会在下次构建时自动重新生成 `llms.txt` / `llms-full.txt` / `sitemap.xml`。
