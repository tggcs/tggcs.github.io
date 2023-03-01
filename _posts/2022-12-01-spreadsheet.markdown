---
layout: post
title: "在线表格项目开发"
date: 2022-12-01 01:26:35 +0800
categories: project
tags:
  - 项目工程实践
  - 在线表格
  - 在线excel
  - spreadsheet
  - 前端
  - js
---

- 分类: 项目工程实践

近期在开发在线表格项目。快收工了，把一些过程&要点记录下。

### 目录

- 一. 前期调研
- 二. 实践情况
- 三. 项目整体结构和涉及的几个主要表格技术细节
- 四. 项目总结

<tg-tit>一. 前期调研</tg-tit>

根据领导需求查看了几种表格方案，如下:

<img src="/images/2022-12-01-1.jpg" >

结论：

1. 需求定制化程度高
2. 需求是不能确定的，且后续要持续迭代（未知）
3. 预期功能较复杂，需要完全掌握相关技术要点
4. 自主开发吧

<tg-tit>二. 实践情况</tg-tit>

<b>演示</b>

<video  controls>
  <source src="/images/2022-12-01-6.mp4" type="video/mp4">
</video>

<b>收集&整理到的需求要点</b>

<tg-p>1. 实现基本的表格功能(单元格，滚动，行列索引...)</tg-p>
<tg-p>2. 业务层面自定义需求(字段，列，维度，冻结滚动，锁定页面，全屏，筛选)...</tg-p>
<tg-p>3. 数据区域</tg-p>

- 支持增减模块
- 多种输入插件(计数器，下拉，百分比，日期选择器等)
- 单元格状态提示，禁用，草稿，错误，必填等
- 支持 EXCEL 函数公式
- 其他...

<tg-p>4. 操作</tg-p>

- 表内外复制粘贴，自动填充
- 悬浮提示
- 键盘快捷操作(上下左右，输入&确认，进入&关闭)
- 其他...

<b>涉及的技术方案</b>

<tg-p>1. 表格实现: 主要参考 x-spreadsheet，lucksheet 源码设计。并考虑由 业务数据转换模块 + 基础表格模块(自定义新特性) 两个主要模块组合支撑业务需求。</tg-p>

> 都是设计良好，运行可靠，功能全面的开源系统。

<tg-p>2. 项目搭建</tg-p>

- 脚手架：`ts`+`rollup`+`eslint` 打包 + 类型检查
- 单元测试：`jest` 必要的功能点自检
- 样式：`sass`+`glup` 打包主题

<tg-p>3. 其他插件支持</tg-p>

- 编辑器：`element-ui`+`vue` 支持全面的编辑插件功能

- 函数公式：`formulajs` 可靠开源，支持函数公式配置

- 代码编辑器：`ace-builds`

<tg-tit>三. 整体结构</tg-tit>

<b>数据流转</b>

<a href="https://kdocs.cn/l/ci7Gc8uO6Z40" target="_blank" title="【金山文档】 PPS_数据转换图">原图地址</a>

<img src="/images/2022-12-01-2.jpg" >
<img src="/images/2022-12-01-3.png" >

<b>类图</b>

<a href="https://kdocs.cn/l/crDTJY1e4Iz2" target="_blank" title="【金山文档】 类图">原图地址</a>

<img src="/images/2022-12-01-4.png" >

<b>执行流程</b>

<a href="https://kdocs.cn/l/ci8dcsj51uPB" target="_blank" title="【金山文档】 执行流程">原图地址</a>

<img src="/images/2022-12-01-5.png" >

<b>技术细节-1-表格绘制</b>

- canvas 模糊问题的处理

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="jOKQMYo" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/jOKQMYo">
  canvas's blurry problems</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

- 表格绘制简单实现

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="zYaMKJK" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/zYaMKJK">
  canvas grid demo</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<b>技术细节-2-数据对象&功能方法分离</b>

表格信息和数据处理方法都存储在`DataProxy.ts`中

<img src="/images/2022-12-01-7.jpg" >

<b>技术细节-3-公式计算</b>

- step1: 配置公式，保存为id信息

`IF(define_40b3c04b7c414a9f8bdf97afe7c273a3== '亚洲',(INPUTNUMBE_r_03561c77aa4a49f5afb7bb573ee16bcd-INPUTNUMBE_r_ffa41f7e2c4742f59e85ee1227890422)* 0.8,(INPUTNUMBE_r_03561c77aa4a49f5afb7bb573ee16bcd-INPUTNUMBE_r_ffa41f7e2c4742f59e85ee1227890422)* 0.6)`
<img src="/images/2022-12-01-9.jpg" >

- step2: `genSheetdata2`转换为标准excel公式 

<img src="/images/2022-12-01-10.jpg" >

- step3: excel公式计算实现，这里直接用了开源框架 `formulajs`

<p class="codepen" data-height="300" data-default-tab="js,result" data-slug-hash="VwdVqem" data-preview="true" data-user="tggcs" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/tggcs/pen/VwdVqem">
  Untitled</a> by 唐鸽 (<a href="https://codepen.io/tggcs">@tggcs</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

<b>技术细节-4-业务配置&表格支持转换</b>

- 具体见项目启动`test.html`

<tg-tit>项目总结</tg-tit>

- 理清&沟通需求相对于技术点调研，同样是件费劲的事
- 比较复杂的项目要做好前置的沟通，争取到领导和同事们最大程度的支持和配合(争取到合理的工时)，是个较长期且有节奏的建设过程
- x-spreadsheet 在各个功能点上的设计都很不错，学习到了很多
- 在线表格可以支撑公司常年的多样且复杂的预算编制和填报需求，是有很大业务价值的

<tg-tit>参考</tg-tit>

- [x-spreadsheet](https://github.com/myliang/x-spreadsheet)
