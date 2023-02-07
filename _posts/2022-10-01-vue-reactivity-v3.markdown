---
layout: post
title: "Vue3源码笔记-响应式 02.简单实现watch"
date: 2022-10-01 01:26:35 +0800
categories: project
tags:
  - vue源码
  - vue3
  - 响应式原理
  - 计算属性
  - 前端
  - js
---

- 分类: vue 源码

以下，均从最简单的一个`{num:0}`对象开始，针对其实现响应式；

<tg-tit>一. 简单实现计算属性</tg-tit>

取 vue 单侧案例 1`should return updated value`, 设定如下的场景：

1. 单击 add 按钮后，触发 trigger 更新 num 值

2. 打印`percentValue.value`值时， 触发匿名函数执行；

```html
<button onclick="add()">add</button>
<div id="value"></div>
<script>
  // 1.获取响应式对象
  const counter = reactive({ num: 0 });
  // 2.获取计算属性
  const percentValue = computed(() => `${counter.num}%`);
  // 3.触发
  let i = 1;
  window.add = () => {
    counter.num = i++;
    console.log(percentValue.value);
  };
</script>
```

<b>对于源码摘录了主要的部分，实现如上功能，追加如下 computed 代码；</b>

```js
import { ReactiveEffect } from "./effect.js";

export class ComputedRefImpl {
  effect;
  constructor(getter) {
    this.effect = new ReactiveEffect(getter);
  }

  get value() {
    return this.effect.run();
  }
}

export function computed(getter) {
  const cRef = new ComputedRefImpl(getter);

  return cRef;
}
```

<b>在线演示</b>

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="dyjgbLR" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/dyjgbLR">
  vue-reactivity-v2</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
