# Site header post title animation

本文说明固定在顶部的站点页头里，**左侧竖条（指示条）**与**当前文章标题**在「无文章标题页」与「`/post/...` 等展示标题页」之间切换时的动画约定与实现对应关系。实现基于 **motion-v**（`AnimatePresence` + `motion.div`），不再使用 Vue 内置 `<Transition>` 与多阶段 FSM。

## Product rules

### 1. No title → has title (show)

1. **指示条**先播放入场（自下而上并渐显）。
2. 指示条 **入场动画结束**（`motion` 的 `@animation-complete`，在 `gateTitleUntilBarDone` 为 true 时用于解除门闩）后，再挂载 **标题** motion 节点并播放入场（自左向右并渐显）。

门闩由 composable 中的 **`gateTitleUntilBarDone`** 控制，**不要**仅靠给标题叠 CSS `transition-delay` 来「假装」晚于竖条。

### 2. Has title → no title (hide)

1. **标题**先离场（自右向左并渐隐）。
2. 标题 **`AnimatePresence` 的 `onExitComplete`** 触发后，再收起 **指示条**（自上而下并渐隐）。

### 3. Has title → has title (switch post)

1. **指示条**保持显示，不做离场/入场。
2. 仅 **标题**：`AnimatePresence` **`mode="wait"`**，子节点 **`motion.div`** 使用稳定 **`:key`**（`presenceTitleKey`，与文章 `path` 一致），由库编排旧标题 exit 再新标题 enter。

**注意**：`onExitComplete` 在「换文」过程中旧标题离场时也会触发；此时路由目标已是新文章，**不能**按「回首页」逻辑去关条。实现里在 `onTitlePresenceExitComplete` 中判断：若 **`targetTitleKey` 与 `targetTitle` 仍有效**则直接 return，仅在真正离开文章页时收起条并清理缓存。

## Implementation map

| Area | File |
|------|------|
| 门闩与 store 同步逻辑 | [`src/composables/useHeaderTitleAnimationState.ts`](../../src/composables/useHeaderTitleAnimationState.ts) |
| `AnimatePresence` / `motion.div`、时长与位移 | [`src/layouts/header.vue`](../../src/layouts/header.vue) |
| 何时写入 `current` | [`src/store/post.ts`](../../src/store/post.ts) |

### Composable overview（无 FSM 命名）

- **`barVisible`**：是否渲染条（`motion.div` + `AnimatePresence`）。
- **`gateTitleUntilBarDone`**：从「无标题 → 有标题」时为 `true`，条入场动画完成后置 `false`，标题区才 `v-if` 挂载；除 `motion` 的 **`onAnimationComplete`**（模板里用 **`:on-animation-complete`**）外，另有 **`HEADER_TITLE_BAR_MS.enter + 50ms` 的定时后备**，防止部分环境下完成回调不触发导致标题永远不出现。
- **`presenceTitleKey` / `presenceTitle`**：标题 motion 的 key 与文案，与 store 目标同步；离站时 key 先清空以触发标题 exit，再在 `onExitComplete` 里清条与缓存。
- **`showTitleMotion`**：`presenceTitleKey` 存在且门闩已打开时为 true，供模板 `v-if`。
- **`headerBarMotion` / `headerTitleMotion`**：`initial` / `animate` / `exit` 对象，供 `motion.div` 绑定。

### motion-v notes

- 依赖为 [`motion-v`](https://github.com/motiondivision/motion-vue)（见项目 `package.json`），从 **`motion-v`** 引入 `AnimatePresence`、`motion`。
- 标题容器使用 **`AnimatePresence mode="wait"`**，等价于「先出后进」，无需手写 `pendingTitleSwap`。
- 条使用单独 **`AnimatePresence`**（默认 `mode="sync"`），与标题解耦。

### Timing constants

[`useHeaderTitleAnimationState.ts`](../../src/composables/useHeaderTitleAnimationState.ts) 导出 **`HEADER_TITLE_BAR_MS`**、**`HEADER_TITLE_TEXT_MS`**（毫秒），并用于 **`headerBarMotion` / `headerTitleMotion`** 的 `transition.duration`（秒）。若改时长，请同时改常量与 motion 对象。

## Data flow

- 页头从 **`usePostsStore().current`** 推导 `targetTitle` / `targetTitleKey`。
- Store 仅在 **`watch(() => router.currentRoute.value.path, …, { immediate: true })`** 中同步 `current`（见 `src/store/post.ts`）。
- **不要**在 **`router.beforeEach`** 里在路由尚未提交前就改 `current`：否则会过早更新标题数据源，与动画门闩错位。

## Manual checks

修改动画相关代码后建议自测：

1. 首页 SPA 进入文章：先条结束，再标题入场。
2. 文章返回首页：先标题离场，再条离场。
3. 文章 A → 文章 B → 文章 C：条始终保留，标题依次换文无空白卡死。
4. 直接打开或刷新 `/post/:id`：仍应先条后标题；若出现 hydration 警告，再考虑 `ClientOnly` 或仅在 `onMounted` 后启用动画。
