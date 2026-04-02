# Astro 部署复盘（从 Hexo 迁移到 GitHub Pages）

## 1. 这次发生了什么

你已经成功把站点迁移到 Astro，并且现在可以正常访问。整个过程中，主要遇到了三类问题：

1. 自定义域名返回 404。
2. GitHub Actions 工作流失败，导致新站点没有真正发布。
3. Node/npm 在 CI 环境安装依赖时出现可选依赖与锁文件一致性问题。

这几类问题叠加后，表面现象就是：
- 仓库看起来已经 push 成功；
- 但访问 blog.huarun.moe 仍然 404 或显示旧内容。

## 2. 事件时间线（按排查顺序）

### 阶段 A：确认站点部署链路3吗，。

- 项目使用 GitHub Pages + GitHub Actions 自动部署。
- 触发条件是 push 到 main。
- 构建产物目录是 dist（不是 public）。

关键认知：
- public 是“静态资源源目录”，你手动放文件。
- dist 是“构建输出目录”，由 astro build 生成。

### 阶段 B：域名 404 的第一层原因

- DNS 解析已正确指向 GitHub Pages（blog.huarun.moe -> fargger.github.io）。
- 但自定义域名仍 404，说明“域名层大概率没问题，部署层有问题”。

### 阶段 C：定位到 Actions 失败

发现工作流为 failing，根因是 Pages 相关 Action 版本过旧，触发了 GitHub 的弃用策略。

修复动作：

- 增加 actions/configure-pages@v5
- 升级 actions/upload-pages-artifact 到 v3
- 升级 actions/deploy-pages 到 v4

### 阶段 D：构建阶段再次失败（native binding）

随后出现：
- Cannot find module @oxc-parser/binding-linux-x64-gnu

这表示在 Linux Runner 中，某些 optional native 依赖没有被正确安装。

为提高稳定性，做了两件事：

1. Node 从 18 升级到 20（与现代 Astro 生态更匹配）。
2. 安装命令明确包含 optional 依赖。

### 阶段 E：npm ci 严格模式报错

使用 npm ci --include=optional 时又报错：
- package.json 与 package-lock.json 不完全同步
- 缺少 @emnapi/runtime / @emnapi/core 条目

这是 npm ci 的设计特性：
- npm ci 是“严格按 lockfile 还原”；
- lockfile 与实际解析结果不一致会直接失败。

最终为保证线上恢复，改为：
- npm install --include=optional

这不是最“严格可复现”的方案，但在当前 lockfile 状态下更稳、更容易成功发布。

## 3. GitHub Actions 原理（新手版）

把它想成“GitHub 云端自动执行脚本的机器人”。

### 3.1 核心概念

1. Workflow（工作流）
- 就是 .github/workflows/deploy.yml 这个文件。
- 定义了“什么时候触发、用什么机器、执行什么步骤”。

2. Trigger（触发器）
- on.push.branches: [main]
- 意味着每次你 push 到 main，都会启动一次自动流程。

3. Runner（执行机器）
- runs-on: ubuntu-latest
- 每次都是一台全新的 Linux 临时机。
- 机器不会记住你上一次安装的内容（除非用 cache）。

4. Job / Step（任务 / 步骤）
- 一个 job 里有多个 step，按顺序执行。
- 某一步失败，后续步骤默认不会继续。

### 3.2 这条 Pages 工作流在做什么

典型步骤是：

1. actions/checkout
- 把你的仓库代码拉到 Runner。

2. actions/setup-node
- 安装指定 Node 版本（例如 20）。

3. npm install
- 安装依赖（这里需要包含 optional 依赖）。

4. npm run build
- 执行 astro build，生成 dist。

5. actions/upload-pages-artifact
- 把 dist 打包成 Pages 可部署的 artifact。

6. actions/deploy-pages
- 把 artifact 部署到 GitHub Pages。

### 3.3 为什么权限要配 contents/pages/id-token

这是 GitHub 的最小授权模型：

- contents: read
  允许读取仓库内容。

- pages: write
  允许发布到 Pages。

- id-token: write
  允许 OIDC 身份令牌，用于安全部署流程。

缺少这些权限时，部署步骤可能报权限错误。

## 4. Node 与 npm 配置背后的逻辑

## 4.1 为什么 Node 版本重要

Node 版本不只是语法问题，还影响：

- 原生模块（native module）兼容性
- 依赖解析行为
- 工具链（Vite/Astro/底层 parser）运行稳定性

Node 18 在很多项目仍可用，但你的链路里出现了 native binding 问题，升级到 Node 20 后更稳妥。

## 4.2 npm ci 与 npm install 的区别

npm ci：
- 速度快、可复现性强。
- 要求 package-lock.json 与 package.json 完全一致。
- 任何不一致都会直接失败（适合成熟稳定 CI）。

npm install：
- 更宽松，会尝试根据 package.json 和 lockfile 做修复性安装。
- 在依赖树临时不一致时更容易“先跑通”。

你这次之所以会在 ci 失败，是因为 lockfile 与实际依赖图（含 optional 链）存在不一致。

## 4.3 optional dependencies 是什么

optional 依赖是“可选安装但某些平台/场景会需要”的依赖。

- 某些包在 Linux 下才需要某个 native binding。
- 如果没装上，构建时就会报 Cannot find module。

这次 oxc-parser 的 Linux binding 就属于这个类别。

## 5. CNAME 与 Astro 的关系

在 Astro 中：

- 把 CNAME 文件放在 public/CNAME。
- 构建时会原样复制到 dist/CNAME。
- Pages 部署后，站点根目录就有 /CNAME。

这和你在 Hexo 的思路一致，只是“静态源目录”从 Hexo 的 public 习惯转成了 Astro 的 public -> dist 链路。

## 6. 为什么文章后来又“消失”了

在站点已经能访问之后，又遇到一个内容层的问题：

- 关于页正常；
- 但是 `src/content/blog` 里的文章没有出现在博客列表里。

### 6.1 根因

问题出在博客内容的 frontmatter 和主题 schema 的默认值组合上。

主题里 blog schema 的 `draft` 字段默认值是 `true`。这意味着：

- 如果某篇文章没有显式写 `draft: false`；
- Astro 在生产环境里就会把它当成草稿处理；
- 草稿不会出现在正常的博客列表和文章页里。

而“关于”页走的是 `special` 集合，不受这个 `draft` 默认值影响，所以它能正常渲染。

### 6.2 为什么本地和线上会表现得像“文章没了”

这类问题很容易误判成：

- 路由错了；
- 文章文件没被扫描到；
- 构建失败了。

但实际上是“内容被过滤掉了”。

也就是说，文件还在，集合也加载了，只是它被主题按草稿状态隐藏了。

### 6.3 这次怎么修

我做了两层修复：

1. 把主题里的 blog schema 默认值改成 `draft: false`，让内容默认按“已发布”处理。
2. 给现有文章统一补上 `draft: false`，确保仓库里明确表达“这些文章要公开展示”。

### 6.4 这个问题背后的技术逻辑

Astro 的内容系统会先读取 frontmatter，再交给 schema 做类型和默认值处理。主题作者可以用 schema 规定：

- 哪些字段必须存在；
- 哪些字段可选；
- 哪些字段有默认值。

如果默认值和你的内容习惯不一致，就会出现“我明明写了文章，但站点不展示”的错觉。

这次的教训是：

- 内容字段默认值不是纯文档，它会直接影响是否渲染；
- 迁移站点时，一定要检查 schema 的默认行为；
- 博客这种“默认应公开”的内容，`draft` 最好显式写成 `false`。

## 7. 这次最终可用的关键配置要点

1. Pages Source 使用 GitHub Actions（不是旧的 branch 模式）。
2. deploy.yml 使用未弃用的 Pages Actions 版本。
3. Node 版本固定为 20。
4. 安装命令支持 optional 依赖。
5. CNAME 放在 public/CNAME。
6. push main 后观察 Actions 是否绿色通过。

## 8. 以后可以怎么避免再次踩坑

1. 把 CI 当作“唯一真相环境”
- 本地能跑不代表云端能跑。
- 每次改部署配置后，第一时间看 Actions 日志。

2. 固定工具链版本
- 锁定 Node 版本（比如 20）。
- 减少“本地和 CI 不一致”。

3. 优先升级被弃用的 Actions
- 定期检查 GitHub Changelog。
- 避免突然被平台策略中断。

4. 若要使用 npm ci
- 先确保 lockfile 干净同步。
- 必要时在统一环境重新生成 lockfile 并提交。

## 9. 一句话总结

这次问题本质不是 Astro 本身，而是“部署流水线版本过期 + CI 依赖安装策略与锁文件状态不匹配”。

你最终修通了完整链路：
代码 push -> Actions 构建 dist -> Pages 部署 -> CNAME 生效 -> 自定义域名可访问。
