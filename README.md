# huarun's Blog

基于 [Astro](https://astro.build/) + [Gyoza](https://github.com/lxchapu/astro-gyoza) 主题的静态博客，部署于 GitHub Pages，访问地址 <https://blog.huarun.moe>。

技术栈：Astro 4 · React 18 · Tailwind CSS · Framer Motion · pnpm

## 环境准备

- Node.js >= 18.18
- pnpm（推荐，见 `package.json` 的 `packageManager` 字段）

```bash
pnpm install   # 首次安装依赖
```

## 常用命令

```bash
pnpm dev        # 本地开发，http://localhost:4321
pnpm build      # 检查 + 构建 + 生成搜索索引（输出到 dist/）
pnpm preview    # 本地预览构建产物
pnpm new-post   # 交互式新建一篇文章
pnpm new-friend # 交互式新建一个友链
```

## 发布文章

文章存放在 `src/content/posts/`，一篇一个 `.md` 文件，**文件名即 URL slug**（只能用字母、数字和连字符，如 `my-first-post.md` → `/posts/my-first-post`）。

两种方式：

```bash
pnpm new-post   # 按提示输入文件名和标题
```

或手动新建 `src/content/posts/<slug>.md`，frontmatter 如下：

```yaml
---
title: 文章标题            # 必填
date: 2026-03-01T12:00:00  # 必填，建议 ISO 8601 格式
lastMod: 2026-03-05        # 可选，更新时间
summary: 一句话摘要         # 可选，显示在列表卡片 + SEO
cover: https://...         # 可选，列表卡片缩略图
category: 学习笔记          # 可选，分类（用于 /categories）
tags: [Astro, 建站]        # 可选，标签（用于 /tags）
comments: true             # 可选，默认 true（当前评论已全局关闭）
draft: false               # 可选，true 时不参与生产构建
sticky: 0                  # 可选，>0 置顶，数字越大越靠前
---
```

> 建议：`date` 使用 ISO 8601 格式（`YYYY-MM-DD` 或 `YYYY-MM-DDTHH:MM:SS`）。Astro 对日期解析比较宽松（带空格的 `YYYY-MM-DD HH:MM:SS` 也能被解析为本地时间），但 ISO 格式更清晰、无时区歧义。

Markdown 支持：KaTeX 公式（`$...$` / `$$...$$` / ```` ```math ````）、表格、代码高亮、脚注、图片（原生 `<img>` 也会自动懒加载）、`||隐藏内容||`、视频嵌入（`:bilibili[id]` 等）。

## 修改站点设置

绝大部分配置在 **`src/config.json`**（不是 astro.config）：

| 配置项 | 作用 |
| --- | --- |
| `site` | 域名、站点标题、描述、关键词、favicon |
| `author` | 作者名、头像 |
| `hero` | 首页大标题、简介、社交链接、一言 |
| `color` | 强调色 / 背景 / 文字 / 边框（light + dark 各一组） |
| `menus` | 顶部导航栏 |
| `posts.perPage` | 每页文章数 |
| `footer.startTime` | 底部运行天数起算时间 |
| `waline.serverURL` | 评论服务地址（留空 = 关闭评论） |
| `analytics` | 统计（Google / Umami / Clarity） |

## 友链

友链条目存放在 `src/content/friends/*.yaml`：

```bash
pnpm new-friend   # 交互式新建
```

或手动新建一个 yaml：

```yaml
title: 网站名称
description: 一句话介绍
link: https://example.com
avatar: https://example.com/avatar.png
```

友链页文案在 `src/content/spec/friends.md`。

## 关于页面

编辑 `src/content/spec/about.md`。

## 部署

推送 `main` 分支即可，GitHub Actions（`.github/workflows/deploy.yml`）会自动执行 `pnpm install` + `pnpm build` 并部署到 GitHub Pages：

```bash
git add . && git commit -m "..." && git push
```

> 提交信息请遵循 [Conventional Commits](https://www.conventionalcommits.org/)（如 `feat:` / `fix:`），仓库配置了 commitlint 校验。
