---
name: geo-post-seo
description: 为文章梳理并生成 GEO/SEO 侧车元数据 seo/posts/<id>.json。默认处理 git 未提交的文章，用户指定文章时只处理指定的；没有未提交文章时提示用户指定。用于「给文章补 description / 关键词 / 要点 / FAQ」「GEO 优化某篇」「跑一下 seo 元数据」这类请求。
---

# 生成文章 GEO 元数据

## 目标

为每篇文章产出 `seo/posts/<id>.json`（`id` 是 frontmatter 里的数字 id），字段：

| 字段 | 必填 | 约束 |
| --- | --- | --- |
| `description` | 是 | 120–160 字符，写「解决什么问题 + 结论/产出」 |
| `keywords` | 建议 | 5–8 个，单个 ≤ 30 字符 |
| `keyPoints` | 建议 | 3–5 条，每条 ≤ 80 字符，是可独立引用的结论 |
| `faq` | 按需 | 0–3 条，问题 6–60 字符、答案 20–300 字符 |
| `about` | 可选 | 主题实体，进 JSON-LD `about` |
| `citations` | 可选 | 一手资料 URL |
| `reviewedAt` | 是 | 当天日期 `YYYY-MM-DD` |
| `status` | 是 | 梳理完成写 `done` |

**不要**把这些字段写回文章 frontmatter——frontmatter 只保留 `id / title / date / tags / categories`。

## 第 1 步：确定目标文章

按优先级：

1. **用户明确指定**（id、slug、目录名、标题片段、`posts/xxx/index.md` 路径）→ 解析成数字 id。匹配不到时列出候选让用户确认，不要猜。
2. **没有指定** → 用 git 找未提交的文章：

   ```bash
   git status --porcelain -- posts
   ```

   只取状态为 `A`/`M`/`AM`/`??` 且路径匹配 `posts/**/index.md` 的条目；移除了 `deleted`，也不要包含 `seo/` 目录自身的改动。
   对每个文件读 frontmatter 取 `id`。

3. **两种情况都没有目标** → 列出最近 5 篇已发布文章（标题 + id）供选择，然后**停下来问用户**，不要自己挑一篇开写。

## 第 2 步：读文章

至少读：frontmatter（标题、日期、标签、分类）、首个标题、前 3 段、所有二级标题、结论段、是否有表格/数据/外链引用。

信息不足时（正文过短、只有占位内容），直接说明「这篇文章内容不足，无法梳理」并跳过，不要编造。

## 第 3 步：梳理 JSON

写作要求：

- `description`：第一句就说清这篇文章解决了什么，第二句给结论或产出；不要「本文介绍了……」这种开场。中文字符数必须落在 120–160。
- `keywords`：搜索者会输入的名词/短语，不要堆砌同义词，5–8 个。
- `keyPoints`：从正文里挑**能脱离上下文独立成立**的结论，带具体数字/版本/命令时保留。
- `faq`：只有正文里确实回答了某个通用问题时才写（问答式教程、踩坑记录）；普通随笔不要硬凑。
- `about` / `citations`：文章有明确主题实体或一手链接时再填。
- `status: "done"`、`reviewedAt` 用当天日期。

## 第 4 步：调用脚本写入

把 JSON 先写到临时文件（避免 shell 引号问题），再交给脚本落盘：

```bash
pnpm seo:write -- --id <id> --file <临时 json 路径>
```

脚本会做 normalize + 校验；出现 `error` 级问题（例如 description 长度不合规）会直接失败、不写入，按提示改完重跑即可。

也可以走 stdin：

```bash
pnpm seo:write -- --id <id> < <临时 json 路径>
```

如果这篇文章还没有任何侧车文件，想先要个草稿骨架，可以：

```bash
pnpm seo:new -- <id>
```

（草稿的 description 是正文派生的，质量有限，正式内容仍要按第 3 步重写。）

## 第 5 步：校验

```bash
pnpm seo:check -- <id> [<id> ...]
```

- `error` 必须修完再继续。
- `warn` 能修就修，修不了在汇报里说明原因。

## 第 6 步：汇报

输出：

- 处理了哪些文章（id + 标题），各自写了哪个文件；
- 每篇的 `description` 字符数、keywords / keyPoints / faq 数量；
- 跳过或失败的文章及原因；
- 未提交（默认不要自动 commit，除非用户要求）。

## 注意

- 只写 `seo/posts/*.json`，不要顺手动正文或 frontmatter。
- 一次处理多篇时逐篇调用脚本，不要手写整目录。
- dev 服务器不会热更新侧车文件，改完需要重启 `pnpm dev` 才能在页面看到变化。
