---
id: 799
title: 在个人简介同步正在玩的 Steam 游戏
date: 2025-03-13 23:24:48
tags:
  - steam
  - 游戏
categories:
  - 瞎研究
---

# 上回

之前写过一个同步我当前正在听的音乐，大概长这样

![](/uploads/2025/03/steam-game-1.png)

# 这次

尝试把当前正在玩的 Steam 游戏展示到个人简介中

于是去看了一下 Steam API，发现还真行，效果是这样的

![](/uploads/2025/03/steam-game-2.png)

![](/uploads/2025/03/steam-game-3.png)

开源：[imba97/me](https://github.com/imba97/me)

# 开源库

为了方便调用，简单封装了一下用到的 Steam API

你可以直接使用 [steam-playing-game](https://github.com/imba97/steam-playing-game) 的 `getUserPlayingGame`

```ts
import { getUserPlayingGame } from 'steam-playing-game'

getUserPlayingGame('steam-api-key', 'user-id')
```

或者使用 `useSteamApi` 获取更详细的参数

```ts
import { useSteamApi } from 'steam-playing-game'

const { getPlayerSummary, getGameDetail } = useSteamApi('steam-api-key')

getPlayerSummary('user-id')
getGameDetail('game-id')
```
