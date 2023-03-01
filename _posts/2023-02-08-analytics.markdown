---
layout: post
title: 前端统计调研
subtitle: 前端统计的调研、搭建、业务实践
author: tg
categories: analytics
tags: ["统计", "监控", "前端", "umami", "javascript"]
# sidebar: []
---

今年，要给公司多数项目加上统计监控；满足低成本、精度要求不高、数据隐私、业务自定义的要求，采用了全埋点方案；

## 调研 - github 开源项目

[awesome list](https://github.com/newTendermint/awesome-analytics){:target="\_blank"}

查看了几个主要的；

### umami

- 定义：全栈服务，支持谷歌同类服务
- 免费
- 语言：js
- 开源：https://github.com/umami-software/umami
- demo：https://app.umami.is/share/8rmHaheU/umami.is

<img src="/images/2023-02-08/1.jpg" >

### plausible

- 定义：全套服务，支持谷歌同类服务
- 收费 or 免费：注册、载入脚本即可; 或可自行搭建；
- 语言：Elixir + React
- 开源：https://github.com/plausible/analytics
- 自建文档：https://plausible.io/docs/self-hosting

### Analytics

- 定义：前端插件，支持前端页面、事件、信息的获取；交给第三方统计分析服务(依赖)；
- 免费 & 开源
- 开源：https://github.com/DavidWells/analytics

<img src="/images/2023-02-08/2.jpg" >

### 结论

选择了 umami

1. 支持统计页面访问量，访问排行，用户量；
2. 支持访问统计用户信息(设备，地域分布)；
3. 支持统计自定义事件；
4. 搭建较好, nodejs 体系比较适合我；

## umami 搭建

### 搭建

<b>1. 申请 or 自建一个 mysql 库</b>

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

### 网址别名翻译

添加 `alias`静态配置和`getAlias`函数，改写源码`renderLink`函数

umami-analyze/components/data/PagesAlias.js

```js
const cfAlias = {
  "^/": "导航页",
  "^/login": "登录页",
  // system 1
  "^/auth": "统一权限",
};

const aliasRegKeys = Object.keys(cfAlias).map((regStr) => {
  return {
    regExp: new RegExp(regStr),
    len: regStr.length,
    key: regStr,
  };
});

const genAliasRegKeys = (alias) => {
  return Object.keys(alias).map((regStr) => {
    return {
      regExp: new RegExp(regStr),
      len: regStr.length,
      key: regStr,
    };
  });
};

const cfAliasRegKeys = genAliasRegKeys(cfAlias);

// 有空再放env去
const idMaps = {
  "44293950-2c24-47b6-bbbe-64c960577f64": {
    keys: cfAliasRegKeys,
    kv: cfAlias,
  },
};

/**
 * 按最长路径匹配
 * @param {*} url
 */
const getLongestMatchString = (aliases = [], url) => {
  return aliases
    .filter(({ regExp }) => regExp.test(url))
    .reduce((prev, current) => {
      return prev.len > current.len ? prev : current;
    }, "");
};

// todo cache加速
export const getAlias = (url, websiteId) => {
  const idMap = idMaps[websiteId] || {};
  const matchKey = getLongestMatchString(idMap.keys, url);
  return idMap.kv[matchKey.key] || "";
};
```

umami-analyze/components/metrics/PagesTable.js

```diff
+ import { getAlias } from 'components/data/PagesAlias';

...

- export default function PagesTable({ websiteId, showFilters, ...props }) {
+ export default function PagesTable({ websiteId, websiteDomain, showFilters, ...props }) {
  ...

  const renderLink = ({ x: url }) => {
-   return <FilterLink id="url" value={url} />;
+   const externalUrl = `https://${websiteDomain}${url}`;
+   return (
+     <FilterLink
+       id="url"
+       title={url}
+       alias={getAlias(url, websiteId)}
+       label={url}
+       value={url}
+       externalUrl={externalUrl}
+     />
+   );
  };

  ...
```

### data-rm-querys 拓展

新增`data-rm-querys`配置项，值为逗号分隔字符串；配置后，页面统计会移除 query 入参信息，解决同一页面的不同 query 的冗余统计信息；

```html
<script
  async
  defer
  data-website-id="b09aeacd-9cae-443a-b55c-dc5e44747043"
  src="http://*/umamiAnalyze/umami.js"
  data-domains="test.umami.com"
  data-rm-querys="id,name"
></script>
```

umami-analyze/tracker/index.js

```diff
...
- const { hostname, pathname, search } = location;
+ const { origin, hostname, pathname, search, hash } = location;

+ const rmQuery = url => {
+   if (!rmQuerys.length) {
+     return url;
+   }
+   url = url.replace(
+     new RegExp(`([&\?]){1}(${rmQuerys.join('|')})=[^&\?#]*`, 'g'),
+     (expr, $1, $2, p1, p2) => {
+       return $1 === '?' ? $1 : '';
+     },
+   );
+   return url;
+ };

  ...
  const domains = domain.split(',').map(n => n.trim());
+ const rmQueryStr = attr(_data + 'rm-querys') || '';
+ const rmQuerys = rmQueryStr.split(',').map(n => n.trim());

  let listeners = {};
- let currentUrl = `${pathname}${search}`;
+ let currentUrl = `${pathname}${search}${hash}`;


  const trackView = (url = currentUrl, referrer = currentRef, websiteUuid = website) =>
    collect(
      'pageview',
      assign(getPayload(), {
        website: websiteUuid,
-       url,
+       url: rmQuery(url),
        referrer,
      }),
    );
  ...
```
