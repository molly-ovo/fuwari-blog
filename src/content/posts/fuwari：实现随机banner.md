---
title: fuwari：实现随机banner
published: 2026-04-13 20:15:27
tags: [fuwari, banner]
category: 折腾日志
description: 将script脚本注入fuwari页面布局以及创建自动扫描脚本实现随机banner
---

#  random-banner的实现

## 前言

在折腾完hexo-fluid的随机banner之后发现了基于 [Astro](https://astro.build/) 开发的静态博客模板，fuwari的页面过渡和动效非常丝滑，于是立马fork了下来部署在了netlify上😋

本文将分享如何通过 Node.js 自动化扫描 + SPA 路由拦截实现首页固定、内页随机banner的效果。

## 文件准备

`图片存放：public/images/random/`

`首页固定：public/images/你的图片.jpg`

`核心配置：src/layouts/MainGridLayout.astro`

## 实现原理

- 文件扫描：在构建前，利用 Node.js 脚本遍历文件夹，生成包含所有图片路径的 json 索引，无需手动维护列表。
- 路由感知：fuwari 使用 swup 实现无刷新跳转，通过监听 swup:content_replaced 事件，确保每次切换页面时都能触发banner的刷新。
- 预加载：通过 swup:clickLink 事件，在点下链接的同时开始后台下载图片。

## 代码实现

### Step1. 生成图片“索引”

主要解决的问题是让程序自动扫描`public/images/random/`下存放的图片，免去手动写数组的步骤，这样一来不管是添加还是删除图片就方便一些。

- 实现方式：在script下创建generate-banners.mjs文件
- 逻辑：用fs模块读取文件夹，过滤出指定格式图片并写入src/generated-banners.json
- 工程化：在 package.json 的 dev 和 build 命令前加上 node scripts/generate-banners.mjs，便于调试和部署

```js
import fs from 'node:fs';
import path from 'node:path';

// 1. 定义你的随机图片存放路径（相对于项目根目录）
const randomDir = path.join(process.cwd(), 'public', 'images', 'random');
// 2. 定义生成的 JSON 存放路径
const outputFile = path.join(process.cwd(), 'src', 'generated-banners.json');

try {
    if (fs.existsSync(randomDir)) {
        const files = fs.readdirSync(randomDir)
            .filter(file => /\.(png|jpe?g|gif|svg|webp|avif)$/i.test(file))
            .map(file => `/images/random/${file}`); // 生成相对 URL 路径

        fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));
        console.log(`✅ 成功扫描到 ${files.length} 张随机 Banner 图！`);
    } else {
        console.warn(`⚠️ 找不到目录: ${randomDir}`);
        fs.writeFileSync(outputFile, JSON.stringify([]));
    }
} catch (err) {
    console.error('❌ 生成 Banner 列表失败:', err);
}
```



### Step2. 注入页面布局

主要实现当Astro 渲染页面时，将图片和逻辑注入到所有页面的公共父级。

源代码位置：`src/layouts/MainGridLayout.astro`

#### 2.1  全局变量与常量

```js
const FIXED_BANNER_SRC = "/images/你的图片.jpg"; // 首页固定
window.BANNER_LIST = banners;                // 注入后端生成的列表
window.lastBannerUrl = "";                    // 记录上一张
window.isBannerProcessing = false;            // 核心状态锁
```

#### 2.2 获取下一个随机图片 URL

```js
function getNextRandomUrl() {
  if (!window.BANNER_LIST || window.BANNER_LIST.length === 0) return null;
  let next = window.BANNER_LIST[Math.floor(Math.random() * window.BANNER_LIST.length)];
  if (window.BANNER_LIST.length > 1 && next === window.lastBannerUrl) {
    next = window.BANNER_LIST.find(url => url !== window.lastBannerUrl);
  }
  return next;
}
```

- 如果列表长度 >1 且随机到的 URL 与上次相同，则手动取另一个不同的 URL（简单防重复）。

#### 2.3 设置横幅图片

```js
function setRandomBanner() {
  if (window.isBannerProcessing) return;          // 避免并发

  const bannerContainer = document.getElementById('banner');
  if (!bannerContainer) return;
  const img = bannerContainer.querySelector('img');
  if (!img) return;

  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/index.html';

  if (isHomePage) {
    // 首页：强制显示固定图片
    if (!img.src.includes(FIXED_BANNER_SRC)) {
      img.src = FIXED_BANNER_SRC;
      img.style.opacity = "1";
    }
    return;
  }

  // 非首页：随机切换
  const randomImg = getNextRandomUrl();
  if (!randomImg) return;

  window.isBannerProcessing = true;
  window.lastBannerUrl = randomImg;

  // 预加载图片，避免切换时闪烁
  const tempImg = new Image();
  tempImg.src = randomImg;
  tempImg.onload = () => {
    img.src = randomImg;
    img.style.opacity = "1";
    setTimeout(() => {
      window.isBannerProcessing = false;  // 延迟释放锁，保证过渡完成
    }, 600);
  };
  tempImg.onerror = () => { window.isBannerProcessing = false; };
}
```

- 主要判断是否为首页，是则固定图片，否则调用 getNextRandomUrl 获取随机图片，然后锁定处理标志，用 Image 对象预加载该图片。加载完成后替换 src，恢复透明度，并延迟释放锁。加载失败时直接释放锁。

#### 2.4 初始化执行时机

```js
if (document.readyState === 'complete') {
  setRandomBanner();
} else {
  window.addEventListener('load', setRandomBanner);
}
```

- 如果文档已完全加载，立即执行；否则等待 load 事件。

#### 2.5 配合 swup 的事件监听

```js
document.addEventListener('swup:clickLink', () => {
  const next = getNextRandomUrl();
  if (next) {
    const preloader = new Image();
    preloader.src = next;   // 提前加载下一张随机图片，提升切换体验
  }
});

document.addEventListener('swup:content_replaced', () => {
  setTimeout(setRandomBanner, 50);  // 新内容替换后，延迟 50ms 重新设置横幅
});
```

- `swup:clickLink`：用户点击链接时触发。预加载一张新的随机图片（不显示，仅缓存）。
- `swup:content_replaced`：新页面内容替换到 DOM 后触发。延迟调用 `setRandomBanner` 更新图片，确保新页面中的横幅元素已存在。

### Step3. 优化全局样式

```css
<style is:global>
  #banner img {
    object-fit: cover !important;
    object-position: center !important;
    transition: opacity 0.5s ease-out, height 0.5s ease-out !important;
    will-change: opacity;
    transform: translateZ(0);
  }
</style>
```

图片高度是可以修改的，文件位于`/src/constants/constants.ts`，我这里直接统一了所有页的高度.

```ts
// Banner height unit: vh
export const BANNER_HEIGHT = 65; // 默认35
export const BANNER_HEIGHT_EXTEND = 0; // 默认30
export const BANNER_HEIGHT_HOME = BANNER_HEIGHT + BANNER_HEIGHT_EXTEND;
```

## 整体流程

1. **页面初次加载** → 判断是否首页 → 首页显示固定图片，其他页面随机显示一张。
2. **用户点击内部链接（swup）** → 预加载下一张随机图片 → 页面内容替换后重新设置横幅图片。
3. **随机策略**：每次随机取一张，避免连续重复（列表长度 >1 时）。
4. **防闪烁**：使用临时 `Image` 对象预加载完成后再替换 `src`，配合 CSS 透明度过渡。

## Tips

在我commit之后出现了两个报错：

`Error: File content differs from formatting output/The imports and exports are not sorted.`

`error ts(2322): Type 'PostForList[]' is not assignable to type 'Post[]'.`

Fuwari 使用了 Biome 作为代码格式化工具。当你修改了 MainGridLayout.astro 或添加了新文件时，如果代码的缩进、空格、甚至 import 的顺序没有完全符合 Biome 的预设规则，CI（持续集成）就会报错。这个问题可以执行Biome的格式检查试一下。

第二个报错指向的是 `Navbar.astro` 和 `archive.astro`，但实际并没有动这两个文件，所以我认为是引入了新的 json 索引文件后，Astro 的类型生成器（`astro sync`）重新扫描全站发现了意外错误。

------

## 结语

尽管遇到了两个提交的报错，但代码还是跑起来了（bushi），这种修改方式本质上是在**静态架构上叠加动态体验**，修改过程中出现了不少问题。例如页内跳转页面时，出现了闪过2-3张图片的奇怪效果，在Gemini的帮助下还是解决了，伟大无需多盐。

