---
layout: post
title: "Vue3源码笔记-响应式"
subtitle:
author:
categories: vue3
tags: ["vue源码", "vue3", "响应式原理", "前端", "js"]
# sidebar: []
---

近期有空看了下 vue3 源码和相关书籍，同时将笔记同步到了博客；后面忘了可以再看看。

## 一. 基本实现

设定基本场景，单击 add 按钮后，`counter.num`值变化，触发 effect 内匿名函数执行，达到响应式效果；

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

### 在线演示

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="YzjgJOM" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/YzjgJOM">
  vue-reactivity-1</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

### 源码拆分

- 定义当前活跃副作用函数、依赖收集桶;

```js
// 全局变量
const targetMap = new WeakMap();
let activeEffect;
```

- 实现依赖收集、触发，即`track`,`trigger`;

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

- 绑定&触发副作用函数;

```js
class ReactiveEffect {
  fn;
  constructor(fn) {
    this.fn = fn;
  }
  run() {
    activeEffect = this;
    return this.fn();
  }
}

function effect(fn) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}
```

### bucket 桶结构

依赖收集桶结构&deps 绑定

<img src="/images/2022-10-01/1.jpg" >

<!-- <tg-tit>二. 拆分文件</tg-tit>

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
``` -->

## 二.嵌套的 effect

设定基本场景，单击 add 按钮后，`counter.num1`值变化, 但打印如下；

```html
<button onclick="add()">add</button>
<script>
  const counter = reactive({ num1: 0, num2: 0 });
  effect(() => {
    effect(() => {
      console.log(`num2:${counter.num2}`);
    });
    console.log(`num1:${counter.num1}`);
  });
  console.log(targetMap);
  let i = 1;
  window.add = () => {
    counter.num1 = i++;
  };
</script>
```

```js
num2: 0;
```

### parent 变量解决嵌套

没有见到`num1:1`的打印，是因为依赖收集时，`activeEffect`是内层副作用函数(且由 set 做了去重)，按 vue3 设计，加一个 parent 变量即可；

```js
...
run() {
  try {
    // parent记录下嵌套的父级activeEffect
    this.parent = activeEffect;
    activeEffect = this;
    return this.fn();
  } finally {
    activeEffect = this.parent;
    this.parent = undefined;
  }
}
...
```

### 在线演示

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="eYjXPME" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/eYjXPME">
  vue-reactivity-2</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## 三.依赖清理

改用二进制标记位的方式，较之前全部清除再收集的方式有更良好的性能(仅删除不需要的副作用函数)；

设定基本场景，单击 add 按钮后，`counter.visible`值切换，`visible===false`时，targetMap 桶内`counter.num2`的 dep 集合应该清空；

```html
<button onclick="toggle()">toggle</button>
<script>
  const counter = reactive({ visible: true, num2: 0 });

  effect(() => {
    if (counter.visible) {
      console.log("num2", counter.num2);
    }
  });

  let visible = true;
  function toggle() {
    visible = !visible;
    counter.visible = visible;
  }
</script>
```

### 源码拆分

- 添加三个变量，用于控制

```js
let effectTrackDepth = 0; // 当前所在副作用函数层级
let trackOpBit = 1; // 所在层级的二进制标记
const maxMarkerBits = 30; // 设定effect最大嵌套30层
```

- 通过`已被收集`和`新的依赖`两个标记来筛选剔除无效副作用函数

副作用函数执行前，执行`initDepMarkers`，将存在`deps`打上`已被收集`标记；副作用函数执行前，执行`finalizeDepMarkers`，将`effect`是 `已被收集` && 非`新的依赖` 删除掉；

```js
initDepMarkers() {
  ...
  deps[i].w |= trackOpBit // set was tracked
}
finalizeDepMarkers() {
  ...
  if (wasTracked(dep) && !newTracked(dep)) {
    dep.delete(effect)
  }
}
run() {
  try {
    ...
    if (effectTrackDepth <= maxMarkerBits) {
      initDepMarkers(this)
    }
    return this.fn();
  } finally {
    if (effectTrackDepth <= maxMarkerBits) {
      finalizeDepMarkers(this)
    }
    ...
  }
}
```

<p class="codepen" data-height="300" data-default-tab="js" data-slug-hash="vYaMvPW" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/vYaMvPW">
  vue-reactivity-2</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<img src="/images/2022-10-01/2.png" >

- 位操作

参考 [权限设计应用](/bit/2019/05/02/bit.html#h-位运算)

四.Ref & toRef

五.readonly & shallowReadonly

六.shallowReactive

七.computed

八.watch
