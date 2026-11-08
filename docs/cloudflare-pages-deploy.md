# Cloudflare Pages 双源部署说明

本文档记录「Netlify + Cloudflare Pages 双源 + Cloudflare Worker 按国家分流」的实施配置。
目标：域名不变、国内与海外分别就近访问、全部使用免费额度。

## 架构

```
访客 → imba97.com（Cloudflare 橙云代理）
         └── Worker: workers/geo-router.ts
               ├── CN / HK / MO / TW → ORIGIN_CN（Pages 或后续国内源站）
               └── 其他            → ORIGIN_GLOBAL（Netlify 或 Pages）
```

## 文件清单

| 文件 | 语言 | 作用 |
|---|---|---|
| `public/_headers` | — | Pages/Netlify 通用响应头（缓存、CORS、安全头） |
| `public/_redirects` | — | 301 重定向与 SPA fallback（`*` 通配） |
| `functions/[[path]].ts` | TS | 给 HTML 补 `must-revalidate` |
| `functions/lib/html-cache.ts` | TS | HTML 路径判定工具函数 |
| `functions/pages.d.ts` | TS | Pages / Workers 的最小类型声明 |
| `functions/.netlify/images.ts` | TS | 旧图片 URL 兜底 302（已弃用，稳定后删除） |
| `workers/geo-router.ts` | TS | 地理分流 Worker |
| `wrangler.toml` | — | Pages 项目名、构建命令、Node 版本 |
| `.github/workflows/deploy-pages.yml` | — | 推送到主分支时自动部署 |
| `scripts/deploy-pages.ts` | TS（esno） | 本地一键部署 |
| `scripts/netlify-image-plugin.ts` | TS | 新增 `IMAGE_PIPELINE=static` |

## 关于 Functions 用 TypeScript

**Cloudflare Pages 原生支持 `.ts`**，不需要额外配置，也不需要在构建时手动编译：
Pages 构建阶段会用 esbuild 自动转译 `functions/` 下的 `.ts` 文件。

需要注意的三点：

1. **同名 `.js` 与 `.ts` 不要并存**。Pages 会同时识别两种扩展名，存在重复路由的隐患。
   迁移时应删除旧的 `.js`。若暂时无法删除，保持 `.js` 为无害空壳（当前仓库状态）。
2. **类型检查由本仓库自己负责**。Pages 构建只做转译，不做类型校验，
   所以 `tsconfig.json` 已把 `functions/**` 与 `workers/**` 纳入 `include`。
3. **本仓库未安装 `@cloudflare/workers-types`**，用 `functions/pages.d.ts` 手写最小声明，
   避免为了两个函数引入一份较大的类型依赖。若日后需要完整的 `caches`、`D1Database`
   等类型，再切换为官方类型包。

### 如果希望彻底消除 `.js` / `.ts` 并存风险

`pwsh` 在当前沙箱不可用，无法自动删除文件，请手动执行：

```powershell
Remove-Item -Recurse -Force functions\.netlify
Remove-Item -Force functions\[[path]].js
Remove-Item -Recurse -Force functions\lib   # 会被 .ts 重新创建，无需删除
```

或使用资源管理器删除 `functions/[[path]].js` 与 `functions/.netlify/` 整个目录。

## 图片处理策略变更（重要）

原实现把文章图片改写成 `/.netlify/images?url=...&q=75&fm=webp`，只有 Netlify 能处理，
双源部署下其他源站会 404，导致整站配图裂图。

现在默认 `IMAGE_PIPELINE=static`：直接输出原图路径，两套源都能原生托管。
若仍需 Netlify 图片优化，可显式设置 `IMAGE_PIPELINE=netlify` 或旧的 `VITE_NETLIFY_IMAGE_*` 变量。

## 首次部署步骤

1. **创建 Pages 项目**
   ```powershell
   pnpm run build:pages
   pnpm dlx wrangler pages project create imba97-blog
   pnpm run deploy:pages
   ```

2. **验证 `*.pages.dev` 可访问**（先不要动 DNS）

3. **部署 Worker**
   - Cloudflare 控制台新建 Worker，粘贴 `workers/geo-router.ts`
   - 环境变量：
     - `ORIGIN_CN` = 国内 / 香港源站域名
     - `ORIGIN_GLOBAL` = `https://imba97-blog.pages.dev` 或 Netlify 域名
     - `CN_COUNTRIES` = `CN,HK,MO,TW`（灰度时可只留 `CN`）
   - 绑定路由：`imba97.com/*`、`www.imba97.com/*`

4. **配置 Cache Rule（免费，必做）**
   - `URI Path starts with /assets/` → Edge TTL 1 年，Cache Eligible
   - `URI Path starts with /uploads/` → 同上

   目的：命中缓存不执行 Worker，节省 10 万次/天的免费额度。

## 验证清单

- [ ] `https://<pages>.pages.dev/` 首页正常
- [ ] 任取一篇文，配图正常显示（Network 中无 `/.netlify/images` 请求）
- [ ] `/atom.xml` 返回 301 到 `/feed.xml`
- [ ] `/posts/<id>` 返回 301 到 `/post/<id>`
- [ ] 随机 SPA 路径直刷返回 200 且渲染正确
- [ ] `/assets/*` 的 `Cache-Control` 含 `immutable`
- [ ] HTML 的 `Cache-Control` 为 `max-age=0, must-revalidate`
- [ ] Worker 返回 `X-Served-By: cn|global`，与访问地一致
- [ ] 断网测试：把 `ORIGIN_CN` 设为不存在域名，确认回退到 `ORIGIN_GLOBAL`

## 已知限制

- Pages 免费版 **单次部署文件数上限 20000**；当前产物远低于此值，但注意不要堆积未压缩原图。
- Worker 免费 **10 万请求/天**；必须配合 Cache Rule。
- 接入国内服务器需先解决 ICP 备案与 Cloudflare 橙云代理的冲突。
- `scripts/netlify-image-plugin.ts` 默认改为 static 后，**图片不再自动转 WebP**，
  带宽收益需要靠 `/uploads/*` 的 immutable 缓存抵消；若要进一步压缩，建议后续补构建期 WebP 预生成。