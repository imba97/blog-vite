---
id: 767
title: nestjs 联表查询
date: 2023-07-30 23:04:38
tags:
  - NestJS
categories:
  - 笔记
---

# 联表查询

浅浅记录一下 `nestjs` 开发的联表查询

用户表和上传表，需求是获取用户列表时联表查询上传表的用户头像

<!--more-->

```typescript
async findAll(page: number, limit: number) {
  const list = await this.userRepository
    .createQueryBuilder('user')
    .select([
      'user_id',
      'name'
    ])
    .leftJoin(Upload, 'upload', 'upload.upload_id = user.avatar')
    .addSelect(['upload.filename as avatar'])
    .offset(limit * (page - 1))
    .limit(limit)
    .getRawMany()

  return {
    list
  }
}
```

没有用 `@OneToOne` 之类的表关系，因为好像数据库要多生成一个 ID 字段 ( ´_ゝ｀)

这边我直接用了 `leftJoin`，指定了 `Update` 这个实体 `(entity)`，拿到 `upload.filename`

需要注意的是 `getMany` 好像会返回空，需要用 `getRawMany`

而且分页的话需要用 `offset` 和 `limit`，`take` 和 `skip` 没效果

# 后言

请教一下各位大佬，如果用 `@OneToOne` 的话要不额外生成 ID 要怎么写
