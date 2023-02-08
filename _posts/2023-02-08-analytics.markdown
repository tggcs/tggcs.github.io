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

## github开源项目

### umami



### plausible

- 定义：全套服务(前后端+数据库)，支持谷歌同类服务
- 收费：注册、载入脚本即可
- 免费：自建，搭建，可改造
- 代码完全开源，git: https://github.com/plausible/analytics
- 自建文档：https://plausible.io/docs/self-hosting
- 语言：Elixir + React

结论：开源&高度自定义、有数据库存储压力(定期清理)、支持请求自定义；

<img src="/images/2023-02-08/1.jpg" >


### Analytics

- 定义：前端插件，支持前端页面、事件、信息的获取；交给第三方统计分析服务；
- 免费 & 开源
- git: https://github.com/DavidWells/analytics

结论：还是要依赖第三方的统计服务，不合适；

<img src="/images/2023-02-08/2.jpg" >