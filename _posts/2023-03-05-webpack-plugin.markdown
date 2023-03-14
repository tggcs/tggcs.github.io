---
layout: post
title: webpack plugin 实现了解
subtitle: 了解下webpack plugin部分的代码
author: tg
categories: webpack
tags: ["webpack", "plugin", "前端", "构建工具", "javascript"]
# sidebar: []
---

Plugins are the backbone of webpack.

Webpack itself is built on the same plugin system that you use in your webpack configuration!

## tabable

核心支架，[hooks 集合](https://github.com/webpack/tapable)，实现了类似发布订阅的模式，但支持更为丰富的特性；

设想存在多个函数 fn1、fn2、fn3...fnx，希望实现如下特性：

1. 实现其注册后，由某一事件触发，即发布订阅；
2. 实现按顺序触发、支持异步(并行 or 串行)、支持中断、支持数据结果传递等特殊逻辑；

### demo 拆解

[sokra](https://github.com/sokra)采用了在运行时按需组合生成代码，然后执行的方式；

[github demo](https://github.com/tggcs/test-webpack/tree/plugin-tapable){:target="\_blank"}

```js
class HookCodeFactory {
  // ...

  create(options) {
    // ...
    return new Function(
      this.args(),
      '"use strict";\n' +
        this.header() +
        this.content({
          onDone: () => "",
        })
    );
  }
```

```js
const SyncHook = require("./SyncHook").SyncHook;

const hook = new SyncHook(["p1", "p2", "p3"]);

const calls = [];
hook.tap("A", (p1, p2, p3) => calls.push(`A.${p1}.${p2}.${p3}`));
hook.tap("B", () => calls.push("B"));

hook.call(1, 2, 3);
// 同步顺序执行
// 不同于常规的发布订阅，tabable将注册的函数在运行时按(自定义的)逻辑生成代码，然后使用Function API执行；
// 可实现复杂函数编排的功能
/**
(function anonymous(p1, p2, p3
) {
  "use strict";
  var _context;
  var _x = this._x;
  var _fn0 = _x[0];
  _fn0(p1, p2, p3);
  var _fn1 = _x[1];
  _fn1(p1, p2, p3);
})
 */

console.log(calls); // [ 'A.1.2.3', 'B' ]
```

### 逻辑示意

<img src="/images/2023-03-05/1.jpg" >
