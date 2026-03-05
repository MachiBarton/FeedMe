# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 提供本仓库的代码指导。

## 项目简介

FeedMe 是一款 AI 驱动的 RSS 阅读器，可聚合多个来源的内容并使用大语言模型自动生成文章摘要。它以静态站点形式构建，可部署到 GitHub Pages、Vercel、阿里云 ESA 或 Docker。

## 技术栈

- **框架：** React 19 + TypeScript 5
- **构建工具：** Vite 6
- **样式：** Tailwind CSS 3 + shadcn/ui
- **路由：** wouter
- **包管理器：** npm（使用 `package-lock.json`，不要使用 pnpm）
- **Node 版本：** 20

## 常用命令

```bash
# 开发
npm run dev              # 启动开发服务器（端口 3000）
npm run build            # 生产构建（输出到 out/ 目录）
npm run preview          # 预览生产构建

# 数据管理
npm run update-feeds     # 获取 RSS 源并生成 AI 摘要
npm run full-build       # 更新数据 + 构建（一键完成）

# 测试
npm run test             # 运行单元测试
npm run test:e2e         # 运行 E2E 测试
```

## 架构设计

### 数据流

1. **构建阶段：** `scripts/update-feeds.js` 使用 `rss-parser` 抓取 RSS 源，通过 OpenAI SDK 生成 AI 摘要，输出 JSON 文件到 `public/data/`
2. **运行阶段：** React 应用从 `public/data/` 加载 JSON 数据并展示

### 数据存储

- **构建时数据：** `public/data/*.json` - RSS 文章内容（静态文件）
- **客户端数据（IndexedDB）：**
  - `article_states` - 文章已读/收藏状态
- **配置数据（localStorage）：**
  - `feedme:preferences` - 用户偏好（主题、布局）
  - `feedme:sidebar-collapsed` - 侧边栏折叠状态
  - `feedme:theme` - 主题设置

### 关键文件

- `src/config/rss-config.js` - RSS 源配置（源列表、maxItemsPerFeed、dataPath）
- `src/config/rss-display-config.js` - 各源展示方式配置（HTML/iframe）
- `scripts/update-feeds.js` - RSS 抓取和 AI 摘要生成逻辑
- `src/lib/data-store.ts` - 客户端数据加载工具
- `src/lib/db.ts` - IndexedDB 封装
- `src/lib/opml.ts` - OPML 导入导出
- `src/lib/search.ts` - 本地搜索
- `src/components/rss-feed.tsx` - 主信息流展示组件
- `src/components/source-switcher.tsx` - 源选择界面
- `src/components/sidebar.tsx` - 侧边栏导航
- `src/pages/article.tsx` - 文章详情页
- `src/router.tsx` - 路由配置（HashRouter 模式）

## 项目结构说明

- 纯 ES 模块（package.json 中设置 `"type": "module"`）
- 路径别名 `@/` 映射到 `./src/`
- Vite 基础路径为 `./`，以兼容静态托管
- 构建输出目录为 `out/`（不是 `dist/`）
- 使用 wouter 的 HashRouter 模式

## 路由设计

使用 **wouter** 的 **HashRouter** 模式（适配静态站点部署）：

| 路由 | 页面 | 状态 |
|------|------|------|
| `/#/` | HomePage | 正常 |
| `/#/article/:id` | ArticlePage | 正常 |
| `/#/favorites` | FavoritesPage | 正常（但为占位组件） |
| `/#/history` | HistoryPage | 正常 |
| `/#/settings` | SettingsPage | 正常 |
| `/#/sources` | SourcesPage | 正常 |
| `/#/about` | AboutPage | 正常 |

**未接入路由的页面：**
- `StarredPage` (`src/pages/starred-page.tsx`) - 更完整的收藏页面，可替换 FavoritesPage

URL 示例：`http://localhost:3001/#/?source=__all__`

## 环境变量

AI 摘要功能需要以下环境变量（参见 `.env.example`）：
- `LLM_API_KEY` - LLM 服务的 API 密钥
- `LLM_API_BASE` - LLM API 基础 URL（如 https://api.siliconflow.cn/v1）
- `LLM_NAME` - 模型名称（如 THUDM/GLM-4-9B-0414）

## CI/CD

GitHub Actions 工作流（`.github/workflows/update-deploy.yml`）：
- 触发条件：每 3 小时、main/dev 分支推送、或手动触发
- 构建静态站点并部署到 GitHub Pages
- 同时推送到 `deploy` 分支供 Vercel/阿里云 ESA 部署

## Docker 部署

Docker 部署使用 dcron 定时更新：
- 更新频率由 `src/config/crontab-docker` 控制
- 定时执行 `npm run update-feeds` 和 `npm run build`

## 功能特性

### 已实现功能
- **多布局展示**：卡片、紧凑、网格、瀑布流、杂志、文本六种布局
- **已读/收藏**：文章已读/未读标记、收藏功能
- **源管理**：源切换器、添加自定义源、OPML 导入导出
- **搜索过滤**：本地全文搜索、多维度过滤
- **阅读历史**：自动记录阅读历史
- **无限滚动**：流畅的无限滚动加载
- **主题切换**：亮色/暗色/系统主题
- **文章详情页**：内部展示，支持 iframe 嵌入
- **响应式设计**：适配桌面端和移动端

### 布局模式
- `card` - 卡片布局（默认）
- `compact` - 紧凑布局
- `grid` - 网格布局
- `masonry` - 瀑布流布局
- `magazine` - 杂志布局
- `text` - 文本布局

## 已知问题

1. **收藏页面：** `/favorites` 显示的是占位组件，而 `starred-page.tsx` 有更完整的实现，可以考虑替换
2. **HashRouter：** 所有路由以 `/#/` 开头，例如 `http://localhost:3001/#/?source=__all__`

## 开发注意事项

1. **包管理器**：使用 npm，不是 pnpm（`package-lock.json` 已提交）
2. **添加新 RSS 源**：编辑 `src/config/rss-config.js`
3. **配置源展示方式**：编辑 `src/config/rss-display-config.js`（支持 `html` 或 `iframe` 模式）
4. **修改 AI 摘要 prompt**：编辑 `scripts/update-feeds.js` 中的 `generateSummary` 函数
5. **不要提交 .env 文件**：包含敏感 API 密钥
