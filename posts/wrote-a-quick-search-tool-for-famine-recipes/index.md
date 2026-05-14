---
id: 797
title: 写了个饥荒食谱速查工具
date: 2025-02-06 12:02:10
tags:
  - dst
  - 饥荒
categories:
  - 个人项目
---

# 使用

项目地址：[https://dst-recipe.netlify.app](https://dst-recipe.netlify.app)

## 基本搜索

在下方输入框中输入关键字，可以是名称、拼音、拼音首字母

展示食材基本信息、制作必须食材和条件

![](/uploads/2025/02/dst-recipe-1.png)

## 多个结果

多个结果可以滑动查看

![](/uploads/2025/02/dst-recipe-2.png)

# 代码分析

逻辑上来说是分为两块，一个是食材，一个是食谱

## 食材

每种食材有不同的属性，比如肉度、怪物度、鱼度等等

所以就需要一个基类来表示食材

```ts
export abstract class IngredientBase extends InstanceClass {
  protected abstract _name: string

  /**
   * 肉度
   */
  protected _meat?: number

  /**
   * 怪物度
   */
  protected _monster?: number

  /**
   * 鱼度
   */
  protected _fish?: number

  // ...
}
```

实现类

```ts
import icon from '~/assets/images/ingredients/monster-meat.png'
import { IngredientBase } from '~/composables/ingredient/ingredientBaseClass'

export default class MonsterMeat extends IngredientBase {
  protected _name = '怪物肉'
  protected _image = icon

  protected override _meat = 1
  protected override _monster = 1
}
```

## 食谱

每种食谱有不同的制作条件，比如所需食材、属性度条件等等

实现方式也相同

```ts
export abstract class FoodBase extends InstanceClass {
  private _pinyin: string = ''
  private _pinyinInitials: string = ''

  protected abstract _name: string
  protected abstract _health: number
  protected abstract _hunger: number
  protected abstract _sanity: number
  protected abstract _rot: number
  protected abstract _cooking: number
  protected abstract _priority: number
  protected abstract _image: string

  /**
   * 合并条件
   */
  protected _merge: IngredientTypeKey[][] = []

  /**
   * 所需食材
   */
  protected _ingredientsCondition: IngredientsCondition = []

  /**
   * 仅限沃利
   */
  protected _warlyOnly: boolean = false

  /**
   * 所需肉度
   */
  protected _meat?: ComparisonOperator

  /**
   * 所需怪物度
   */
  protected _monster?: ComparisonOperator

  // ...
}
```

除了所需属性度之外，还有一些其他配置，例如 `_merge`，可以表示某几个属性度任意一个满足即可

比如火鸡正餐

```ts
import type { IngredientTypeKey } from '~/enums/ingredientType'
import type { ComparisonOperator } from '~/types/comparisonOperator'
import type { IngredientsCondition } from '~/types/ingredientsCondition'
import icon from '~/assets/images/foods/turkey-dinner.png'
import { FoodBase } from '~/composables/food/foodBaseClass'
import Drumstick from '~/ingredients/drumstick'

export default class TurkeyDinner extends FoodBase {
  _name = '火鸡正餐'
  _health = 20
  _hunger = 75
  _sanity = 5
  _rot = 6
  _cooking = 60
  _priority = 10
  _image = icon

  protected override _ingredientsCondition: IngredientsCondition = [
    {
      ingredients: [
        Drumstick
      ],
      condition: {
        ge: 2
      }
    }
  ]

  protected override _merge: IngredientTypeKey[][] = [
    ['vegetable', 'fruit']
  ]

  protected override _meat: ComparisonOperator = {
    gt: 1
  }

  protected override _vegetable: ComparisonOperator = {
    ge: 0.5
  }

  protected override _fruit: ComparisonOperator = {
    gt: 0
  }
}
```

会显示为这样

![](/uploads/2025/02/dst-recipe-3.png)

`_ingredientsCondition` 是所需食材，有时也需要表示某几种食材满足一种即可

比如发光浆果慕斯

```ts
import type { ComparisonOperator } from '~/types/comparisonOperator'
import type { IngredientsCondition } from '~/types/ingredientsCondition'
import icon from '~/assets/images/foods/glow-berry-mousse.png'
import { FoodBase } from '~/composables/food/foodBaseClass'
import GlowBerry from '~/ingredients/glowBerry'
import LesserGlowBerry from '~/ingredients/lesserGlowBerry'

export default class GlowBerryMousse extends FoodBase {
  _name = '发光浆果慕斯'
  _health = 3
  _hunger = 37.5
  _sanity = 10
  _rot = 8
  _cooking = 20
  _priority = 30
  _image = icon

  protected override _ingredientsCondition: IngredientsCondition = [
    [
      {
        ingredients: [
          GlowBerry
        ],
        condition: {
          ge: 1
        }
      },
      {
        ingredients: [
          LesserGlowBerry
        ],
        condition: {
          ge: 2
        }
      }
    ]
  ]

  protected override _fish: ComparisonOperator = {
    ge: 1
  }

  protected override _notEdible: ComparisonOperator = {
    eq: 0
  }

  protected override _warlyOnly = true
}
```

会显示为这样

![](/uploads/2025/02/dst-recipe-4.png)

# 开源

<span icon i-mdi-github></span> [imba97/dst-recipe](https://github.com/imba97/dst-recipe)

# 数据来源

<span icon i-ph-files-duotone></span> [饥荒中文维基-烹饪](https://dontstarve.huijiwiki.com/wiki/%E7%83%B9%E9%A5%AA)
