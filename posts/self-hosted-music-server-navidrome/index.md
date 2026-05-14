---
id: 782
title: 自建音乐服务 Navidrome
date: 2024-06-01 11:41:36
tags:
  - Navidrome
categories:
  - 瞎研究
---

# Navidrome

Navidrome 是一个支持自建的 <span icon i-ph-music-notes-duotone bg-primary></span> 音乐服务

除了自带的页面，还兼容很多支持连接自建服务的音乐软件

<!--more-->

# 软件截图

我目前用的是这两个，点击查看大图

<MusicClientList />

# 音乐刮削器

用的是 Music Tag Web，也是可通过 `Docker` 部署的应用，可以自动或手动搜索、写入音乐信息

可以点击标题右侧的 <span icon i-material-symbols-line-end-arrow-rounded></span> 右箭头搜索音乐信息，在右侧列表找到合适的后点击 <span icon i-material-symbols-line-start-arrow-rounded></span> 左箭头同步信息保存

这样就有音乐的相关信息，封面、歌手、专辑、年份等信息基本都有了

![](/uploads/2024/06/navidrome-3.png)

# 搭建

## Navidrome

Navidrome 可以通过 `Docker` 部署，可以连接 [last.fm](https://www.last.fm/) 和 [ListenBrainz](https://listenbrainz.org/) 记录播放历史、生成音乐报告等

```yaml
version: '3'
services:
  navidrome:
    image: deluan/navidrome:latest
    privileged: true
    ports:
      - '4533:4533'
    restart: unless-stopped
    environment:
      ND_SCANSCHEDULE: 1h
      ND_LOGLEVEL: info
      ND_SESSIONTIMEOUT: 24h
      ND_BASEURL: ''
      ND_CONFIGFILE: /data/navidrome.toml
      # 开启分享
      ND_ENABLESHARING: true
      # last.fm 配置
      ND_LASTFM_APIKEY: xxx
      ND_LASTFM_SECRET: xxx
      ND_LASTFM_LANGUAGE: zh
    volumes:
      - '/navidrome/data:/data'
      - '/NAS/music:/music:ro'
```

## last.fm

在 [https://www.last.fm/api/account/create](https://www.last.fm/api/account/create) 申请 API Key 和 Secret

Callback URL 好像可以随便写，因为最后在设置里登录的时候，会在 URL 后面带一个

申请后在 [https://www.last.fm/api/accounts](https://www.last.fm/api/accounts) 查看（这个地址还真不好找）

## Music Tag Web

```yaml
version: '3'
services:
  music-tag:
    image: xhongc/music_tag_web:latest
    privileged: true
    container_name: music-tag-web
    ports:
      - '8001:8001'
    volumes:
      - /NAS/music:/app/media:rw
      - /music_tag_web/data:/app/data
    command: /start
    restart: always
```
