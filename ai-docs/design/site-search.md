# 站内搜索：测量、缺陷定位与 Rust/WASM 实施记录

> 结论先行，且已被实测修正过一轮：
> **中文检索确实能用，但文档级召回只有 39.7%**（50 个真实中文词、597 个「词 × 文档」对里只找回 237 个），
> 失败模式是「整词恰好落在句子中间」。修复它只需要约 30 行 TS 的自定义分词器，**不需要 Rust**。
> Rust/WASM 的真正价值在于把该修复带来的冷启动/内存成本收回去，以及长期掌控分词与排序——
> **不是**索引下载体积（实测预建二进制索引 + 正文比原来的 JSON 更大）。
>
> 本文档同时是**实施记录**：Rust 库已落地为独立仓库 `bigseek`，由 Netlify 构建期拉取编译，
> 产物落进 `public/search/`，Worker 侧双引擎可切换。落地结果见 §3。

## 1. 现状架构与数据流

| 环节 | 位置 |
| --- | --- |
| 构建期生成索引 | `scripts/generate-search-index.ts`（markdown-it → `stripHtml` → 截断 100k 字符） |
| 触发时机 | `scripts/vite/plugins/search-index.ts`（dev `listening` 时 + `buildStart`） |
| 产物 | `public/search-meta.json`（22 KiB，标签/分类候选）、`public/search-full.json`（**401 KiB**，全文） |
| 交互层 | `src/composables/use-site-search-query.ts`（1s debounce、前缀 `#`/`/` 联想、scope chip） |
| 传输层 | `src/composables/site-search-worker.ts`（latest-wins 队列、`requestId` 对账、错误降级） |
| 计算层 | `src/workers/site-search.worker.ts`（双引擎：wasm 优先，MiniSearch 回退） |
| 契约 | `SiteSearchMainToWorkerMessage` / `SiteSearchWorkerToMainMessage` / `SearchHit` |

## 2. 测量结果

方法：`node` 复刻 worker 的索引与查询配置，语料取构建产物 `public/search-full.json`（144 篇）。

| 指标 | 实测 |
| --- | --- |
| payload | 401 KiB / **gzip 165 KiB** |
| `JSON.parse` | 1.4 ms |
| `MiniSearch.addAll`（现状分词） | **79 ms**（桌面 Node；手机按 3~5× 估） |
| 单次查询 | 0.03~0.4 ms |
| 索引堆占用 | default 4.6 MiB → **bigram 14.5 MiB** |
| 索引词条 | default 12197 → bigram 24134 |

### 2.1 根因：MiniSearch 默认分词器不切中文

`MiniSearch.getDefault('tokenize')` 按 `/[\n\r\p{Z}\p{P}]+/u` 切分，中文「标点之间的整句」成为一个 token：

```
输入：简述 最开始知道这个方法是在公司一位大佬的代码里看到的 语言是 TypeScript ...
分词：["简述","最开始知道这个方法是在公司一位大佬的代码里看到的","语言是","typescript",...]
```

配合 `prefix: true`，只有**从片段开头起的前缀**才能命中：

| 查询 | 语料含该词的文档 | 句首出现 | 句中出现 | 返回 |
| --- | --- | --- | --- | --- |
| `请求接口`（标题前缀） | 4 | 2 | 2 | 3 ✅ |
| `最开始知道`（句首） | 1 | 1 | 0 | 1 ✅ |
| `浏览器` | 24 | 11 | 36 | 12 ⚠️ 只回一半 |
| `性能` | 4 | 0 | 4 | **0 ❌** |
| `重写` | 1 | 0 | 1 | **0 ❌** |
| `vue`（英文） | 13 | — | — | 20 ✅ |

### 2.2 真实词表的文档级召回

50 个中文技术词，度量「语料里确实含该词的文档，有多少被检索到」：

| 分词器 | 文档级召回 | 完全命中的词 | 单字查询 | 建索引 |
| --- | --- | --- | --- | --- |
| **现状 default** | **237/597 = 39.7%** | **0/48** | 2/4 | 79 ms |
| CJK bigram | 587/597 = 98.3% | 47/48 | 4/4 | 300 ms |
| CJK unigram+bigram | 587/597 = 98.3% | 47/48 | 4/4 | 505 ms |

- 唯一「未完全命中」的 `配置`（40/50）是 `SEARCH_LIMIT_DEFAULT = 40` 截断所致，放开 limit 后 50/50。
- 英文召回不受影响（8/8）。
- **unigram+bigram 没有额外收益**（`prefix: true` 已让单字通过前缀命中 bigram），但索引更慢更大 → 不采用。

### 2.3 bigram 的坑

`性能优化` → `性能`/`能优`/`优化`。若语料里没有「能优」这个连续串，纯 AND 会误伤成 0 结果。
本语料里「性能优化」恰好不是任何文章的连续子串（0 篇），所以这个坑一定会被踩到——
解法是**两段式检索**：先 AND，为空再退化为 OR 并按命中 token 数排序（见 §3.4）。

### 2.4 其它缺陷

1. **`limit` 静默截断**：默认 40，高频词会被截断，UI 没有「共 N 条」提示。
2. **snippet 定位粗糙**：`buildSnippet` 只用第一个空格分隔词做 `indexOf`。
3. **`fuzzy` 对中文无效**：`maxDistance = floor(0.12 × 词长)`，对整句 token 毫无意义。
4. **scope 过滤是后置 filter**：先全文检索再 `results.filter(scopePaths)`。

## 3. 实施结果

### 3.1 仓库与产物

搜索库落在**独立仓库** [`bigseek`](https://github.com/imba97/bigseek)（本地已 `git init` + 首个提交，待 push）：

```
src/tokenize.rs        归一化 + CJK bigram（native 与 wasm 共用同一份实现）
src/format.rs          80B 头部 / 前端编码词典 / 稀疏块索引 / delta-varint postings
src/build.rs           索引构建
src/query.rs           索引加载 + 检索（块二分 → 候选 → 原文校验 → 打分 → 摘要）
src/posts.rs           直读文章（frontmatter/YAML → 发布规则 → markdown 转纯文本），cli feature
src/wasm.rs            wasm-bindgen 边界（手工拼 js_sys 对象，不引 serde）
src/bin/build-index.rs 构建期 CLI（--posts-dir / --input）+ `--verify` 召回自检
testdata/tokenize-vectors.json     跨语言分词向量（Rust 与 TS 共用）
testdata/post-policy-vectors.json  跨语言发布规则向量（Rust 与 TS 共用）
tests/wasm_abi.rs                  wasm ABI 契约测试（纯 Rust 编写，wasm-pack test --node 执行）
tests/direct_read_parity.rs        直读 vs JSON 的真实语料差分对拍（opt-in）
tests/real_corpus.rs               真实语料召回回归（opt-in）
```

> 仓库里**没有任何 JS 代码**：早期的 `scripts/smoke-wasm.mjs`（Node 冒烟）与
> `scripts/bench-wasm.mjs`（测量工具）已移除，前者由 `tests/wasm_abi.rs` 取代（见 §3.3）。

博客侧接线：

```
scripts/search-wasm/config.ts             环境变量 → 构建配置
scripts/search-wasm/build.ts              拉源码 → 编译 → 各项自检 → 原子落地 public/search/
scripts/search-wasm/parity.ts             TS 分词器 vs Rust 向量对拍
scripts/search-wasm/post-policy-parity.ts TS 发布规则 vs Rust 向量对拍
src/utils/search-tokenize.ts              TS 侧分词器镜像（wasm 与 MiniSearch 回退共用）
src/workers/site-search.worker.ts         双引擎 Worker
public/search/                            产物目录（wasm / glue / search.idx / manifest.json，已 gitignore）
```

### 3.2 索引格式（v1）

```
header 80 B   magic "BSSI" | version | flags | doc_count | term_count | block_count
              terms/blocks/postings/docs/pool/facets 各自的 off/len
terms         按字典序前端编码的词条记录，每 16 条为一块
              varint prefix_len | varint suffix_len | suffix | varint postings_len | varint doc_freq
blocks        稀疏块索引（16 B/块）；块内首词共享前缀置 0 → 可从任意块直接顺序解码
postings      doc id 升序 delta + varint
docs          定长 48 B：path/title/date/text/tags/cats 的 (off, len)
pool          原始字符串（tags/cats 用 U+001F 连接），相同串去重
facets        varint 计数 + (名称, doc id 列表)
```

**踩过的坑**：头部最初按 72 字节开，实际有 19 个 u32 字段（0..76），`FACETS_LEN` 写到 72 就压在了
terms 段第一条词上，导致整个词典解不出来。现在头部固定 80 字节（末尾 4 字节保留），
`format.rs` 里有注释钉住这一点。

### 3.3 五层自检

| 层 | 位置 | 执行时机 | 内容 |
| --- | --- | --- | --- |
| 分词一致性 | `parity.ts` + `tests/tokenize_vectors.rs` | 博客构建 + `cargo test` | 两侧读同一份 `testdata/tokenize-vectors.json`（17 个用例），任何一侧改动分词都会红灯 |
| 发布规则一致性 | `post-policy-parity.ts` + `tests/post_policy_vectors.rs` | 博客构建 + `cargo test` | 同一份 `post-policy-vectors.json`（21 个用例），锁住 draft 真值 / date 判空 / id 数字 / 标签归一化 |
| 召回自检 | `build-index --verify` | 博客构建 | 写盘后立刻重新加载，自动抽样 ≥40 个中文词（跨文档重复出现的 2 字 CJK 串），文档级召回 <95% 直接非 0 退出 |
| 双路径哈希门禁 | `scripts/search-wasm/build.ts` | 博客构建 | 同一次构建用 `--posts-dir` 与 `--input` 各建一份索引，SHA256 必须相同；不同即中断（详见 §3.10） |
| wasm ABI 契约 | `tests/wasm_abi.rs`（**纯 Rust**） | 搜索库 CI：`wasm-pack test --node` | `query()` 是否返回 JS 数组、字段集合是否为约定的 8 个、`tags` 是否为 JS 字符串数组、纯范围浏览 snippet 是否为空、非法字节流是否抛可捕获异常 |

**为什么 ABI 契约不放博客构建里**：它需要 `wasm-pack test`（额外编一遍测试 harness，wasm-pack 会重新下 wasm-bindgen）。
放在搜索库 CI 里跑一次就够——ABI 变更会让 CI 红灯，而且博客构建每次都会重新编译 `pkg/`，
字段真的对不上时运行期会立刻暴露（worker 里 query 异常被 catch 成空结果，可见但不致命）。
早期那版 Node 冒烟脚本能跑在博客构建里，代价是搜索库必须存放 JS 代码，取舍换成了现在这样。

### 3.4 检索流程

```
query(q, tag, category, limit)
  1. 归一化：逐字符 1:1（全角→半角 / U+3000→空格 / ASCII 大写→小写）
  2. 分词：CJK bigram + 拉丁按 \p{L}\p{N} 切
  3. 候选：精确查词；单字 CJK 与末位 token 额外做词典前缀展开（二分定位块 → 块内顺序解码）
  4. 过滤：tag/category 分面求交
  5. 两段式：先 AND（全部 token 命中），为空退化为 OR
  6. 打分：命中 token 数 → 字段权重（title 4 / tag 3 / category 2 / body 1）+ 整串命中 +6
  7. 摘要：在归一化文本里定位命中，把字符下标映射回原文切窗口（依赖「归一化不增删字符」）
```

字段权重不建多份倒排：只在文档级建倒排，字段级判断在候选集上现算（几十次 `contains`），
省掉 4 倍词典体积。

### 3.5 实测结果（全部来自部署产物）

| 指标 | 现状（MiniSearch 默认） | MiniSearch + bigram（回退路径） | **wasm（主路径）** |
| --- | --- | --- | --- |
| 文档级召回 | 237/597 = **39.7%** | **598/598 = 100%** | **598/598 = 100%** |
| 冷启动 | 79 ms 建索引 + 1.4 ms 解析 | 300 ms 建索引（手机 ~1 s） | **1.2~1.5 ms 加载，零建索引** |
| 索引内存 | 4.6 MiB（JS 堆） | 14.5 MiB（JS 堆） | wasm 线性内存，字节切片按需读 |
| 平均查询 | 0.3 ms | 0.3~2 ms | **1.14 ms**（含 OR 回退与子串校验） |
| 下载体积 | 401 KiB / gzip 165 KiB | 同左 | 654 KiB / gzip 约 225 KiB |
| 索引词条 | 12197 | 24134 | 24154 |

（两条引擎路径在放开 `limit` 后都是 100%；UI 默认 `limit: 40`，高频词会被截断——这是既有行为，未改。）

体积构成与 wasm 体积：

| 项 | 大小 |
| --- | --- |
| 词典（前端编码） | 180 KiB |
| postings（delta+varint） | 54 KiB |
| 文档表（48 B × 144） | 7 KiB |
| 字符串池（含正文，摘要需要） | 388 KiB |
| 分面 | 3 KiB |
| **search.idx 合计** | **654 KiB** |
| `bigseek_bg.wasm` | **75.4 KiB** |
| `bigseek.js`（glue） | 12.4 KiB |
| Worker chunk 变化 | 21.7 → 23.6 KB |

> ⚠️ **体积不是本方案的收益点**：654 KiB 比原来的 401 KiB 更大，gzip 后约 225 KiB vs 165 KiB
> （+约 60 KiB，3G 下约 +0.5 s）。换来的是冷启动从 300 ms 降到 1.5 ms、内存从 14.5 MiB 降到 wasm 线性内存、
> 以及两条路径都拿到 100% 召回。**不要用「省流量」当理由**，也别走「预建 MiniSearch 索引快照」那条路
> （实测 gzip 165 KiB → **323 KiB**，直接翻倍）。

### 3.6 运行时引擎选择

```ts
VITE_SEARCH_ENGINE=auto        // 默认：先试 wasm，失败回退 MiniSearch（并 warn 一条原因）
VITE_SEARCH_ENGINE=wasm        // 强制 wasm，失败即报错（便于排查）
VITE_SEARCH_ENGINE=minisearch  // 强制旧引擎（A/B 或应急）
```

- Worker 的 `ready` 消息新增 `engine: 'wasm' | 'minisearch'`，dev 下会打印一行，方便确认线上跑的是哪个。
- 两条路径共用 `src/utils/search-tokenize.ts`，所以**回退不是「降级到残废」**：MiniSearch 路径同样是 100% 召回。
- `public/search-full.json` 仍然产出（回退路径懒加载用），wasm 路径不会去取它。

### 3.7 构建接线

```bash
# package.json
"build": "esno ./scripts/search-wasm/build.ts && vite-ssg build && ..."
"search:wasm": "esno ./scripts/search-wasm/build.ts"
"search:check-parity": "esno ./scripts/search-wasm/parity.ts ... && esno ./scripts/search-wasm/post-policy-parity.ts ..."
```

`build.ts` 的流程与设计取舍：

1. **原子落地**：先构建到 `node_modules/.cache/bigseek/staging`，最后一次性拷贝；
   任何一步失败都清掉 `public/search/`，让运行期干净地回退，而不是拿到半套产物。
2. **默认可降级**：`SEARCH_WASM_OPTIONAL=1`（默认），失败只警告不阻断站点发布，并打印醒目横幅；
   设 `0` 则中断构建。
3. **失败可见**：`SEARCH_WASM_SKIP=1` 复用已有产物时会打印 manifest 里的 commit/构建时间并警告索引可能过期。
4. 用 `cargo metadata` 取 `target_directory`（而不是猜 `target/release`），兼容 `CARGO_TARGET_DIR` 自定义。

环境变量：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `SEARCH_WASM_REPO` | `https://github.com/imba97/bigseek.git` | 源码仓库 |
| `SEARCH_WASM_REF` | `main` | 分支 / tag / 提交号（建议 Netlify 上锁 tag 或 commit） |
| `SEARCH_WASM_TOKEN` | 空 | 私有仓库时的 token，日志里自动打码 |
| `SEARCH_WASM_LOCAL_DIR` | 空 | 直接用本地目录，跳过 clone（单仓库联调/离线开发） |
| `SEARCH_WASM_OPTIONAL` | `1` | 失败是否降级继续 |
| `SEARCH_WASM_SKIP` | `0` | 完全跳过本次构建 |
| `SEARCH_WASM_CARGO_OFFLINE` | `0` | cargo 走 `--offline`（本地无网/走代理时用） |
| `SEARCH_WASM_INSTALL_WASM_PACK` | `1` | 缺少 wasm-pack 时用官方脚本自动安装（只下预编译二进制） |
| `SEARCH_WASM_BOOTSTRAP` | `0` | 缺少 cargo 时自动安装 rustup 工具链；已在 `netlify.toml` 里打开 |
| `VITE_SEARCH_ENGINE` | `auto` | 运行时引擎选择 |

Netlify 相关说明：

- **`wasm-pack` 一定不会预装**，所以脚本默认自动安装；否则每次构建都会静默回退，这套东西等于白做。
- `netlify.toml` 里设了 `SEARCH_WASM_BOOTSTRAP=1`：镜像自带 Rust 时无副作用，不带时会装 rustup（minimal profile）。
- 生产环境建议把 `SEARCH_WASM_REF` 锁到 tag 或 commit（`netlify.toml` 里有注释行），
  避免搜索库主干改动直接影响发版。
- 私有仓库需要 `SEARCH_WASM_TOKEN`（日志里自动打码）。

Netlify 侧新增 `/search/*` 的 `Cache-Control: public, max-age=3600, must-revalidate`（与 `/search-full.json` 同策略：
URL 不带 hash，索引每次构建都会变，必须回源校验）。

### 3.8 成本与回滚

| 成本 | 量 |
| --- | --- |
| 本地热构建 | **实测 +约 3 s**（全量 `pnpm run build` 27.7 s，其中 client 6.8 s + server 5.1 s） |
| 本地冷编译 | 约 +90 s（cargo release + wasm32 各编译一遍） |
| Netlify 首次构建 | 预计 +1.5~3 分钟（另需下载 crate、wasm-bindgen-cli、binaryen；未在 Netlify 实测，属估算） |
| 下载体积 | +约 60 KiB gzip |
| 查询延迟 | 0.3 ms → 1.14 ms（无观感差异） |

回滚只需一步：`VITE_SEARCH_ENGINE=minisearch`（或删掉 `public/search/`）。
搜索库本身出问题也不会阻断发布（默认 `SEARCH_WASM_OPTIONAL=1`）。

### 3.9 尚未做

- **拼音首字母 / 同义词 / 时间衰减排序**（原计划 P3）：当前语料不需要，要加就在 `tokenize` / `query` 里扩，
  同样受向量测试约束。
- **增量更新索引**：现在是每次构建全量重建（144 篇 40 ms，无必要增量）。
- **词典体积压缩**：180 KiB 是 24154 个 bigram 词条的必然结果。若要压，可以只对 `body` 用 bigram、
  `title`/`tags` 保持整词，或改用真正的 FST（预计再省 20~35%）。
- **`limit` 截断提示**：UI 仍不显示「共 N 条」。

### 3.10 直读文章模式（`--posts-dir`）

原先 Rust CLI 必须读 `search-full.json`：好处是「哪些文章可发布 / id 怎么算 / 标签怎么归一化」只有 TS 一份实现，
坏处是构建期多一次往返，而且索引内容被 `stripHtml` 拍平后就没有扩展空间了。现在两条输入路径并存：

```bash
build-index --posts-dir <posts/> --output <search.idx> --verify   # 直读文章（推荐）
build-index --input <search-full.json> --output <search.idx>      # 读 JSON（回归基准 / 旧流程）
```

**实测：两条路径在 144 篇真实语料上产出字节级完全相同的索引**（同一 SHA256 `650db427743d9a41`），
术语数 24154、postings 53246 也完全一致。

付出的代价与对应的三道防线：

| 新增的复刻面 | 防线 |
| --- | --- |
| 发布规则（draft 真值 / date 判空 / id 数字 / 标签归一化） | `testdata/post-policy-vectors.json`（21 用例）Rust 与 TS 各校验一遍 |
| markdown → 纯文本（comrak vs 裸 markdown-it） | `tests/direct_read_parity.rs` 对拍 144 篇正文，要求逐字一致 |
| 日期排序 + 路径生成 | 同一份对拍测试断言文档顺序与 `/post/{id}` 逐字一致 |
| 「规则悄悄漂移」这个元风险 | 博客构建里的**哈希门禁**：同一次构建分别用两条路径建索引并比对 SHA256，不同即中断 |

哈希门禁失败时的行为是刻意设计的：抛错 → 被 `SEARCH_WASM_OPTIONAL=1` 的兜底捕获 → 打印醒目横幅 →
站点照常发布但搜索回退 MiniSearch。**不会半套产物上线，也不会因为搜索库的问题阻断发版。**

#### 踩到的坑：markdown-it 的默认 preset 不是 CommonMark

第一版移植把 comrak 的 `table` / `strikethrough` 关掉了（我以为裸 `markdown-it` = CommonMark），
差分测试立刻报出 4 篇不一致：

```
/post/816  相似度 0.7975   表格：JSON 无管道符，直读保留 `| 层 | 对应项目 |`
/post/750  相似度 0.9966   删除线：JSON 无 `~~`，直读保留 `~~B站机器人~~`
```

`markdown-it` 的**默认 preset**（非 `commonmark` preset）自带 table 与 strikethrough。打开这两项后
144/144 篇逐字节一致。这也说明：这类移植**必须靠差分测试，不能靠读文档推断**。

#### 依赖隔离

`comrak` / `serde_yaml_ng` / `regex` 只挂在 `cli` feature 上，`wasm` 是独立 feature。
实测直读模式上线后 `bigseek_bg.wasm` 仍是 **75.4 KiB**，一点没变。

## 4. 验证方式（可复现）

```bash
# 搜索库自身（注意：测试不要加 --release，release 为 wasm 体积设了 panic=abort）
cd bigseek
cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings
cargo test                     # cli 在 default 里，无需额外 feature 参数
wasm-pack build --target web --release --out-dir pkg --no-default-features --features wasm
cargo run --release --bin build-index -- \
  --input tests/fixtures/search-full.json --output target/smoke.idx --verify
wasm-pack test --node --no-default-features --features wasm

# 直读 vs JSON 的差分对拍（真实语料，要求 144 篇正文逐字一致）
BLOG_POSTS_DIR=../imba97-blog-vite/posts \
BLOG_SEARCH_DOCS=../imba97-blog-vite/public/search-full.json \
cargo test --test direct_read_parity -- --nocapture

# 真实语料召回（要求 100%）
BLOG_SEARCH_DOCS=../imba97-blog-vite/public/search-full.json \
BLOG_SEARCH_INDEX=../imba97-blog-vite/public/search/search.idx \
cargo test --test real_corpus -- --nocapture

# 博客侧（一条命令跑完：拉源码 → 分词/发布规则向量对拍 → 直读建索引 + 召回自检
#          → 双路径哈希门禁 → wasm 编译 + 冒烟 → 原子落地）
SEARCH_WASM_LOCAL_DIR=../bigseek pnpm run search:wasm
pnpm run build
```

> **编辑器提示**：`posts` / `wasm` 两个模块分别挂在 `cli` / `wasm` feature 上。
> rust-analyzer 若只按默认 feature 分析会报 `unresolved import`——那是 feature 未启用，不是编译错误。
> 搜索库自带 `.vscode/settings.json`（`rust-analyzer.cargo.features: ["cli","wasm"]`）避免这个噪音。
>
> **wasm-pack 必须带 `--no-default-features`**：`cli`（comrak / serde_yaml_ng / regex）在 default 里，
> 忘了加不会坏（实测 wasm 只大 5 KiB），但构建会变慢。

## 附：本文件里「现状」相关数字的测量方法

所有基线数字来自本地 `node` 脚本，直接读构建产物 `public/search-full.json`（144 篇），
逐字复刻 `site-search.worker.ts` 的 `fields` / `boost` / `searchOptions` / `limit`。
实施结果一节的数字来自对 `dist/` 里部署产物的直接调用（wasm 引擎 + MiniSearch 回退各跑一遍 50 词召回）。
