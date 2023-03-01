---
layout: post
title: "前端统计调研"
subtitle:
author:
categories: bit
tags: ["统计", "监控", "前端", "umami", "javascript"]
# sidebar: []
---

今年，要给公司多数项目加上统计监控；满足低成本、精度要求不高、数据隐私、业务自定义的要求，采用全埋点方案；

## github 开源项目

awesome list: https://github.com/newTendermint/awesome-analytics

查看了几个主要的；

### umami

- 定义：全栈服务，支持谷歌同类服务
- 免费
- 语言：js
- 开源，https://github.com/umami-software/umami
- demo：https://app.umami.is/share/8rmHaheU/umami.is

<img src="/images/2023-02-08/1.jpg" >

### plausible

- 定义：全套服务，支持谷歌同类服务
- 收费 or 免费：注册、载入脚本即可; 或可自行搭建；
- 语言：Elixir + React
- 开源，https://github.com/plausible/analytics
- 自建文档：https://plausible.io/docs/self-hosting

### Analytics

- 定义：前端插件，支持前端页面、事件、信息的获取；交给第三方统计分析服务(依赖)；
- 免费 & 开源
- 开源：https://github.com/DavidWells/analytics

<img src="/images/2023-02-08/2.jpg" >

## umami 搭建

选择了 umami，功能强大且 js 体系比较适合我；

### 搭建

<b>1. 申请一个 mysql 库</b>

<b>2. 项目下添加`.env`文件，配置如下：</b>

```yml
# 数据库信息
DATABASE_URL="mysql://root:123456@172.16.56.54/umami_test_db"
```

<b>3. 调整 Dockerfile</b>

- `yarn` 改用 `pnpm`
- 移除部分变量读取
- 合并部分指令(RUN)，减小容器层数
- 移除权限指令
- 保留分阶段打包特性

```Dockerfile
# step1
# Install dependencies only when needed
FROM node:16-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install



# step2
# Rebuild the source code only when needed
FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ARG DATABASE_TYPE
# ARG BASE_PATH

# ENV DATABASE_TYPE $DATABASE_TYPE
# ENV BASE_PATH $BASE_PATH

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g pnpm && pnpm build-docker



# step3
# Production image, copy all the files and run next
FROM node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm install -g pnpm && pnpm add npm-run-all dotenv prisma

# You only need to copy next.config.js if you are NOT using the default configuration
COPY --from=builder /app/next.config.js .
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 80

ENV PORT 80

CMD ["pnpm", "start-docker"]
```

## 业务特性实现

<b>1. 网址别名翻译</b>

添加 `alias`静态配置和`getAlias`函数，改写源码`renderLink`函数

```js
const alias = {
  "^/": "导航页",
  "^/login": "登录页",
  // system 1
  "^/auth": "统一权限",
};

const aliasRegKeys = Object.keys(itAlias).map((regStr) => {
  return {
    regExp: new RegExp(regStr),
    len: regStr.length,
    key: regStr,
  };
});

/**
 * 按最长路径匹配
 * @param {*} url
 * @returns
 */
const getLongestMatchString = (url) => {
  return aliasRegKeys
    .filter(({ regExp }) => regExp.test(url))
    .reduce((prev, current) => {
      return prev.len > current.len ? prev : current;
    }, "");
};

export const getAlias = (url) => {
  const matchKey = getLongestMatchString(url);
  return itAlias[matchKey.key] || "";
};
```

<img src="/images/2023-02-08/3.jpg" >

<b>2. `data-rm-querys`拓展</b>

新增`data-rm-querys`配置项，值为逗号分隔字符串；配置后，页面统计会移除 query 入参信息，解决同一页面的不同 query 的冗余统计信息；

```html
<script
  async
  defer
  data-website-id="b09aeacd-9cae-443a-b55c-dc5e44747043"
  src="http://mis.t.aispeech.com.cn/umamiAnalyze/umami.js"
  data-domains="test.umami.com"
  data-rm-querys="id,name"
></script>
```

<img src="/images/2023-02-08/4.jpg" >


 

### 相关技术

- Prisma.io ORM 框架
- Docker
