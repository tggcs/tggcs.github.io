---
layout: post
title: "Vue3源码笔记-响应式 01.简单实现"
date: 2022-10-01 01:26:35 +0800
categories: project
tags:
  - vue源码
  - vue3
  - 响应式原理
  - 前端
  - js
---

- 分类: vue 源码

近期在阅读 vue3 的源码，但源码量巨大且包含了各种边界处理、特殊框架需求等，使得理解起来很难；想了下，从各个模块主线入手，拆解出核心功能，逐个梳理下，从简单到复杂的实现基本的 vue3 框架；达到理解的目的；

以下，均从最简单的一个`{num:0}`对象开始，针对其实现响应式；

<tg-tit>一. 最简单的实现</tg-tit>

设定如下的场景，单击 add 按钮后，`counter.num`值变化，触发 effect 内匿名函数执行，达到响应式效果；

```html
<button onclick="add()">add</button>
<div id="value"></div>
<script>
  // 1.获取响应式对象
  const counter = reactive({ num: 0 });
  // 2.副作用函数
  effect(() => {
    console.log("effect", counter);
    document.getElementById("value").innerText = counter.num;
  });
  // 3.触发
  let i = 1;
  window.add = () => {
    counter.num = i++;
  };
</script>
```

<b>在线演示</b>

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="ExpezZY" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/ExpezZY">
  vue3-</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<b>对于源码摘录了主要的部分，实现如上功能，分为 3 部分；</b>

<tg-p>1. 定义全局的当前副作用函数，依赖收集桶;</tg-p>

```js
// 全局变量
const targetMap = new WeakMap();
let activeEffect;
```

<tg-p>2. 实现依赖收集、触发，即`track`,`trigger`;</tg-p>

vue3 用 proxy 代理，最基本的就是在 get,set 内设置收集和触发的机制；

```js
// 实现响应式对象，拦截get，set，加入track，trigger
function track(target, type, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }

  dep.add(activeEffect);

  console.log("track", targetMap);
}

function trigger(target, type, key, newValue) {
  const depsMap = targetMap.get(target);

  console.log("\n trigger", target, type, key, newValue);
  depsMap.get(key).forEach((effect) => {
    effect.run();
  });
}

function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      const res = Reflect.get(target, key, receiver);
      track(target, "get", key);
      return res;
    },
    set(target, key, value, receiver) {
      const res = Reflect.set(target, key, value, receiver);
      trigger(target, "set", key, value);
      return res;
    },
  });
}
```

<tg-p>3. 实现副作用函数;</tg-p>

```js
class ReactiveEffect {
  fn;
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    console.log("run", this);
    activeEffect = this;
    return this.fn();
  }
}

function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
```

<b>bucket 桶结构，收集副作用函数</b>

<img src="/images/2022-10-01/1.jpg" >

<tg-tit>二. 拆分文件</tg-tit>

<a href="https://github.com/tggcs/sourcecode-vue3/tree/main/reactivity/vue-reactivity-v2" target="_blank" title="github地址">github 地址</a>

<a href="https://unpkg.com/sourcecode-vue3@1.0.2/reactivity/vue-reactivity-v2/test.html" target="_blank" title="演示地址">演示地址</a>

```md
- .
  ├── test.html # 入口
  ├── src  
  │ ├── baseHandlers.js # proxy 代理实现
  │ ├── effect.js # 依赖收集&触发逻辑
  │ ├── operations.js # 枚举
  │ ├── reactive.js # 响应式封装
```
