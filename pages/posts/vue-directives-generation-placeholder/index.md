---
id: 760
title: Vue 自定义指令生成 placeholder
date: 2023-02-16 22:57:41
tags:
  - Vue
  - 指令
categories:
  - 瞎研究
---

# 需求产生

在使用表单时，表单的输入框、选择器会设置 `placeholder` 属性来进行提示

不设置感觉空荡荡的，但如果自己一条条的写又感觉非常麻烦

![](/uploads/2023/02/auto-placeholder-1.jpg)

那我们为何不封装个指令，让它自己加呢

# 思路

因为我用的是 `element-plus`，组件都有固定的样式、模板

比如

```vue
<el-form-item label="姓名">
  <el-input></el-input>
</el-form-item>
```

最后的代码就是

```vue
<div class="el-form-item">
  <label for="title" class="el-form-item__label">姓名</label>
  <div class="el-form-item__content">
      <div class="el-input">
      <input type="text" class="el-input__inner">
    </div>
  </div>
</div>
```

那我们只需要获取到具体的输入框，然后给它设置属性就可以

`Vue` 指令可以在组件挂载后拿到添加指令的 `DOM` 元素，再用 `DOM` 的 `querySelector` 获取到所有 `el-form-item` 子元素，遍历后再根据 `label` 的内容给 `input` 设置 `placeholder`

# 代码参考

```js
import _ from 'lodash'

export default { 
  beforeMount(el) {
    if (!(_.isFunction(_.get(el.classList, 'contains')) && el.classList.contains('el-form'))) {
      console.warn('v-auto-placeholder 指令需要放在 el-form 上使用')
      return
    }

    // 取出 form 下所有 el-form-item
    const formItems = el.querySelectorAll('.el-form-item')

    _.forEach(formItems, item => {
      // label element
      const labelEl = _.get(item.children, '0', '')

      // label 文本，如果 label 有子级，则取出子级第一个的 文本
      const label = _.get(labelEl.children, 'length', 0) > 0 ? _.get(labelEl.children, '0.children.0.innerText', '') : _.get(labelEl, 'innerText', '')

      // content element
      const contentEl = _.get(item.children, '1')

      // input 框
      const input = contentEl && contentEl.querySelector ? contentEl.querySelector('input,textarea') : null

      // 原 placeholder
      const placeholder = _.get(input, 'placeholder')

      // 如果有值则不替换
      if (placeholder && placeholder !== '' && placeholder !== '请选择') {
        return
      }

      // 取出内容第一个元素的 classList
      const classList = _.get(contentEl, 'children.0.classList')

      // 根据不同组件显示不同文本
      if (_.some(classList, (className) => ~[
        'el-select',
        'el-cascader'
      ].indexOf(className))) {
        if (input) input.setAttribute('placeholder', `请选择${label}`)
      } else {
        if (input) input.setAttribute('placeholder', `请输入${label}`)
      }
    })
  }
}
```

# 最终效果

在 `el-form` 加上 `v-auto-placeholder`

```vue
<el-form v-auto-placeholder>
  <el-form-item label="姓名">
    <el-input></el-input>
  </el-form-item>

  <!-- ... -->
</el-form>
```

就可以自动生成 `placeholder`

![](/uploads/2023/02/auto-placeholder-2.jpg)
