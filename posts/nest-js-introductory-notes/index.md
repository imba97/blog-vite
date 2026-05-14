---
id: 755
title: Nest JS 入门笔记
date: 2022-07-10 15:48:29
tags:
  - nestjs
categories:
  - 笔记
---

<!-- eslint-disable -->

# 使用契机

前段时间打算做一个系统，涉及前后端

前端分为用户端和后台管理，后台发布任务，用户端签到、签退

选后端框架时挑挑拣拣，最后感觉 `Nest JS` 的装饰器写法令我非常满意，于是就决定下来了

# 学到的东西

## Typeorm

使用 `typeorm` 维护数据库字段

```typescript
/**
 * 用户ID 主键
 */
@PrimaryGeneratedColumn({ type: 'int', comment: '用户ID' }) id: number

/**
 * 用户名
 */
@Column({ type: 'varchar', length: 20, comment: '用户名' }) username: string

/**
 * 密码
 */
@Column({ type: 'varchar', length: 50, comment: '密码' }) password: string
```

自动维护时间

```typescript
/**
 * 创建时间
 */
@CreateDateColumn({ type: 'datetime', comment: '创建时间' }) created_at: Date

/**
 * 最后更新时间
 */
@UpdateDateColumn({ type: 'datetime', comment: '最后更新时间' }) updated_at: Date

/**
 * 删除时间
 */
@DeleteDateColumn({ type: 'datetime', comment: '删除时间' }) deleted_at: Date
```

删除时间可以用于软删除

数据关系，比如一个用户有多辆车

```typescript
// user.entity
@OneToMany(() => Car, (car) => car.user)
car_list: Car[]

// car.entity
@ManyToOne(() => User, (user) => user.car_list)
@JoinColumn()
user: number
```

## JWT 认证

因为[官网文档](https://docs.nestjs.cn/9/security?id=%e8%ae%a4%e8%af%81%ef%bc%88authentication%ef%bc%89)太详细了，就简单说一下

分为 `local` 策略和 `JWT` 策略

`local` 策略用于登录接口，验证用户名密码是否正确，登录成功后把 `Token` 返回，前端保存在本地

`JWT` 就是其他接口的验证了，请求接口时携带保存的 `Token`，后端能从 `Token` 中取到保存的户信息
