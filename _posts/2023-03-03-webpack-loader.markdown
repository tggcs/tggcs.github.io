---
layout: post
title: webpack loader 实现了解
subtitle: 了解下webpack loader部分的代码
author: tg
categories: webpack
tags: ["webpack", "loader", "前端", "构建工具", "javascript"]
# sidebar: []
---

Webpack enables use of loaders to preprocess files.

This allows you to bundle any static resource way beyond JavaScript.

## demo 演示

用一个经典的 css 配置演示下工作流，debug 代码：[test-loader-css](https://github.com/tggcs/test-webpack/tree/loader-css){:target="\_blank"}

src/color.css

```css
div {
  color: purple;
}
```

src/index.js

```js
import "./color.css";

function component() {
  const element = document.createElement("div");
  element.innerHTML = "hello";
  return element;
}
document.body.appendChild(component());
```

loaders/colors-map-loader/index.js

```js
const colorMap = new Map();
colorMap.set("purple", "#800080");

exports.default = function colorMapLoader(source) {
  colorMap.forEach((value, key) => {
    source = source.replace(key, value);
  });
  return source;
};
```

webpack.config.js

```js
const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          path.resolve(__dirname, "loaders/colors-map-loader"),
        ],
      },
    ],
  },
};
```

如上的 loader 遵循从右往左的顺序执行，即`style-loader(css-loader(colors-map-loader()))`;

但`style-loader`内实现了[pitch](https://webpack.js.org/api/loaders/#pitching-loader){:target="\_blank"}函数,遵循如下顺序执行

```md
|- a-loader `pitch`
|- b-loader `pitch`
|- c-loader `pitch`
|- requested module is picked up as a dependency
|- c-loader normal execution
|- b-loader normal execution
|- a-loader normal execution
```

### 1.style-loader.pitch

经过`pitch`执行后，返回 head 内嵌 style 逻辑和相应的 css 文件

<img src="/images/2023-03-03/1.jpg" >

这里中断了。但生成了行内 内联 loader，后续又开始执行新的 loader 配置？？？？？(todo)

https://juejin.cn/post/7037696103973650463#heading-9

### 2.colors-map-loader

执行自定义的简单逻辑(替换 color 值)

<img src="/images/2023-03-03/2.jpg" >
<img src="/images/2023-03-03/3.jpg" >

### 3.css-loader

执行逻辑(略),生成内嵌的 css 脚本

<img src="/images/2023-03-03/4.jpg" >
<img src="/images/2023-03-03/5.jpg" >

### 4.style-loader

无逻辑

```js
...
const loaderAPI = () => {}; // 无逻辑
loaderAPI.pitch = function loader(request) {
  ...
}
...
var _default = loaderAPI;
exports.default = _default;
```

## 关键的 loader-runner

考虑到不能穷举所有文件类型。webpack 设计了 loader 的方式，让开发者有自行处理文件的能力；

### 整体工作流程

如下图所示(网上常见)，按 loader 循序左至右的 pitch 流程，后读取文件内容，后右至左的 normal 流程；

其中，pitch 可执行中断，提前结束流程；
<img src="/images/2023-03-03/6.jpg" >

### 源码关键实现

简化的 debug 代码：[test-loader-runner](https://github.com/tggcs/test-webpack/tree/loader-runner){:target="\_blank"}

<img src="/images/2023-03-03/7.jpg" >

#### 读取配置&初始化上下文

```js
exports.runLoaders = function runLoaders(options, callback) {
  // read options
  var resource = options.resource || "";
  var loaders = options.loaders || [];
  var loaderContext = options.context || {};
  var processResource = ((readResource, context, resource, callback) => {
    readResource(resource, callback);
  }).bind(null, readFile);

  // prepare loader objects
  loaders = loaders.map(createLoaderObject);

  loaderContext.loaderIndex = 0;
  loaderContext.loaders = loaders;
  loaderContext.resourcePath = resource;

  loaderContext.async = null;
  loaderContext.callback = null;

  var processOptions = {
    resourceBuffer: null,
    processResource: processResource,
  };
  ...
};
```

#### 迭代 pitch

根据 loaderIndex 标记判断 loader 遍历进度，累增；

当然，若其中 pitch 有数据返回，则中断遍历过程，直接略过后续 loader；

```js

  // iterate
  if (currentLoaderObject.pitchExecuted) {
    loaderContext.loaderIndex++;
    return iteratePitchingLoaders(options, loaderContext, callback);
  }

  // load loader module
  loadLoader(currentLoaderObject, function (err) {
    var fn = currentLoaderObject.pitch;
    currentLoaderObject.pitchExecuted = true;
    if (!fn) return iteratePitchingLoaders(options, loaderContext, callback);

    runSyncOrAsync(fn, loaderContext, [], function (err) {
      var args = Array.prototype.slice.call(arguments, 1);

      var hasArg = args.some(function (value) {
        return value !== undefined;
      });
      if (hasArg) {
        loaderContext.loaderIndex--;
        iterateNormalLoaders(options, loaderContext, args, callback);
      } else {
        iteratePitchingLoaders(options, loaderContext, callback);
      }
    });
  });
}
```

#### 迭代 loader

loaderIndex 判断 loader 遍历完毕后，再从右到左遍历 loader；loaderIndex 开始递减；

```js
function iterateNormalLoaders(options, loaderContext, args, callback) {
  if (loaderContext.loaderIndex < 0) return callback(null, args);
  var currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];
  // iterate
  if (currentLoaderObject.normalExecuted) {
    loaderContext.loaderIndex--;
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }
  var fn = currentLoaderObject.normal;
  currentLoaderObject.normalExecuted = true;
  if (!fn) {
    return iterateNormalLoaders(options, loaderContext, args, callback);
  }
  convertArgs(args, currentLoaderObject.raw);
  runSyncOrAsync(fn, loaderContext, args, function (err) {
    var args = Array.prototype.slice.call(arguments, 1);
    iterateNormalLoaders(options, loaderContext, args, callback);
  });
}
```

## 经典 \*-loader 了解一下

...
