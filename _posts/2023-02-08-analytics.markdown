---
layout: post
title: "前端统计调研"
subtitle:
author:
categories: bit
tags: ["统计", "监控", "前端", "javascript"]
# sidebar: []
---

今年，要给公司多数项目加上统计监控；本着低成本、精度要求不高、数据隐私的原则，采用全埋点方案；

## github 开源项目

awesome list: https://github.com/newTendermint/awesome-analytics

查看了几个主要的；

### umami

- 定义：全栈服务，支持谷歌同类服务
- 免费
- 语言：js
- 开源，https://github.com/umami-software/umami
- demo：https://app.umami.is/share/8rmHaheU/umami.is

### plausible

- 定义：全套服务，支持谷歌同类服务
- 收费 or 免费：注册、载入脚本即可; 或可自行搭建；
- 语言：Elixir + React
- 开源，https://github.com/plausible/analytics
- 自建文档：https://plausible.io/docs/self-hosting

<img src="/images/2023-02-08/1.jpg" >

### Analytics

- 定义：前端插件，支持前端页面、事件、信息的获取；交给第三方统计分析服务(依赖)；
- 免费 & 开源
- 开源：https://github.com/DavidWells/analytics

<img src="/images/2023-02-08/2.jpg" >

## umami 搭建

选择了 umami，功能强大且 js 体系比较适合我；

### 搭建

### 相关技术

- Prisma.io ORM框架