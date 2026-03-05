# FeedMe 文档中心

本文档目录包含 FeedMe RSS 阅读器的完整设计和开发文档。

## 文档清单

| 文档 | 说明 |
|------|------|
| [architecture.md](./architecture.md) | 架构设计文档，描述数据分层、存储策略和模块架构 |
| [features.md](./features.md) | 功能模块设计文档，详细描述各功能模块的设计方案 |
| [data-model.md](./data-model.md) | 数据模型设计文档，定义所有数据类型和 IndexedDB Schema |

## 快速导航

### 如果你是开发者
1. 先看 [architecture.md](./architecture.md) 了解整体架构
2. 参考 [data-model.md](./data-model.md) 了解数据结构设计

### 如果你是产品经理
1. 查看 [features.md](./features.md) 了解功能设计

## 项目概述

FeedMe 是一款 AI 驱动的 RSS 阅读器，可聚合多个来源的内容并使用大语言模型自动生成文章摘要。

### 核心特性

- **多布局展示**：支持卡片、紧凑、网格、瀑布流、杂志、文本六种布局
- **AI 摘要**：通过 LLM 自动生成文章摘要
- **文章排序**：支持按日期、来源、标题等多种方式排序
- **搜索过滤**：本地全文搜索、按来源/时间过滤
- **无限滚动**：流畅的无限滚动加载体验
- **无限滚动**：流畅的无限滚动加载体验
- **主题切换**：亮色/暗色/系统主题
- **响应式设计**：适配桌面端和移动端

### 技术栈

- **框架**：React 19 + TypeScript 5
- **构建工具**：Vite 6
- **包管理器**：npm
- **样式**：Tailwind CSS 3 + shadcn/ui
- **路由**：wouter (HashRouter 模式)
- **存储**：IndexedDB (idb) + localStorage
- **搜索**：fuse.js 本地模糊搜索
- **测试**：Vitest + Playwright

## 路由结构

使用 wouter 的 HashRouter 模式（适配静态站点部署）：

| 路由 | 页面组件 | 说明 |
|------|----------|------|
| `/#/` | HomePage | 全部文章列表 |
| `/#/settings` | SettingsPage | 设置页面（主题、布局偏好） |
| `/#/sources` | SourcesPage | 订阅源管理（添加/删除 RSS 源） |
| `/#/about` | AboutPage | 关于页面 |
| `/#/article/:id` | ArticlePage | 文章详情页（支持 HTML/iframe 嵌入） |

侧边栏导航项：
- 全部文章 → `/#/`
- 订阅源 → `/#/sources`
- 设置 → `/#/settings`
- 关于 → `/#/about`

## RSS 订阅配置

项目提供了 RSS Feed 配置 skill，位于 `.claude/skills/rss-feed-config/skill.md`，包含：
- RSS 源配置方法
- 数据流说明
- 常见问题排查
- 添加新 RSS 源步骤

## 更新记录

| 日期 | 版本 | 说明 |
|------|------|------|
| 2024-03 | 1.0 | 初始版本 |
| 2024-03 | 1.1 | 添加多布局支持、阅读历史、文章详情页 |
| 2025-03 | 2.0 | 移除已读/收藏功能，添加文章排序、六种布局模式、RSS 配置 skill |

