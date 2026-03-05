# 架构设计文档

本文档描述 FeedMe RSS 阅读器的架构设计，基于纯前端、无后台的约束条件。

## 设计原则

1. **数据分层**：构建时生成的 RSS 数据与客户端用户数据分离
2. **存储策略**：IndexedDB 存储用户行为数据，localStorage 存储轻量配置
3. **兼容性**：保持现有 GitHub Actions 自动更新机制不变
4. **纯前端**：不依赖后端服务，所有数据存储在客户端

## 数据架构

### 数据分层

```
┌─────────────────────────────────────────────────────────────┐
│                      数据层架构                              │
├─────────────────────────────────────────────────────────────┤
│  构建时数据 (静态文件)                                        │
│  ├── public/data/*.json          # RSS 文章内容             │
│  └── public/data/manifest.json   # 构建元数据               │
├─────────────────────────────────────────────────────────────┤
│  客户端数据 (IndexedDB)                                       │
│  ├── article_states              # 文章交互状态             │
│  │   ├── isRead                  # 已读状态                 │
│  │   └── isFavorite              # 收藏状态                 │
│  └── reading_history             # 阅读历史                 │
├─────────────────────────────────────────────────────────────┤
│  配置数据 (localStorage)                                      │
│  ├── feedme:preferences          # 用户偏好设置             │
│  ├── feedme:sidebar-collapsed    # 侧边栏折叠状态           │
│  └── feedme:theme                # 主题设置                 │
└─────────────────────────────────────────────────────────────┘
```

### 数据流

```
用户打开应用
     │
     ▼
┌──────────────────────────────────────┐
│  1. 加载构建时数据                      │
│     - 加载 RSS JSON 文件               │
│     - 默认显示全部文章                   │
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  2. 并行加载客户端数据                  │
│     - 从 IndexedDB 读取文章状态          │
│     - 读取用户自定义源                   │
│     - 读取偏好设置                      │
└──────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│  3. 数据合并与展示                      │
│     - 内置源 + 用户源合并               │
│     - 应用文章状态标记                  │
│     - 渲染界面                         │
└──────────────────────────────────────┘
```

## 存储策略

### IndexedDB 设计

**数据库名称**: `FeedMeDB`
**版本**: `1`

| Store 名称 | 主键 | 索引 | 说明 |
|-----------|------|------|------|
| `article_states` | `link` | `sourceUrl`, `isRead`, `isFavorite` | 文章交互状态 |

### localStorage 设计

| Key | 类型 | 说明 |
|-----|------|------|
| `feedme:preferences` | JSON | 主题、字体大小等偏好 |
| `feedme:sidebar-collapsed` | boolean | 侧边栏展开/折叠状态 |
| `feedme:theme` | string | 当前主题 (light/dark/system) |

## 模块架构

```
src/
├── components/           # UI 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── rss-feed.tsx      # 主 RSS feed 组件（多布局）
│   ├── source-switcher.tsx   # 源选择器
│   ├── search-bar.tsx    # 搜索栏
│   ├── sidebar.tsx       # 侧边栏导航
│   ├── layout-switcher.tsx   # 布局切换器
│   ├── article-card.tsx  # 文章卡片
│   ├── infinite-article-list.tsx  # 无限滚动文章列表
│   ├── lazy-image.tsx    # 懒加载图片
│   └── settings/         # 设置页面组件
├── lib/
│   ├── db.ts             # IndexedDB 封装
│   ├── search.ts         # 本地搜索
│   ├── data-store.ts     # 数据加载
│   ├── types.ts          # TypeScript 类型
│   └── utils.ts          # 工具函数
├── hooks/
│   ├── use-articles.ts   # 文章数据管理
│   ├── use-infinite-scroll.ts  # 无限滚动
│   ├── use-preferences.ts    # 偏好设置
│   └── use-toast.ts      # Toast 通知
├── pages/                # 页面组件
│   ├── home.tsx          # 首页（全部文章）
│   ├── article.tsx       # 文章详情页
│   ├── favorites.tsx     # 收藏页面（占位）
│   ├── history.tsx       # 阅读历史
│   ├── settings.tsx      # 设置页面
│   ├── sources.tsx       # 订阅源管理（未接入路由）
│   ├── about.tsx         # 关于页面（未接入路由）
│   └── starred-page.tsx  # 收藏页面（完整版，未接入路由）
├── config/
│   ├── rss-config.js     # RSS 源配置
│   └── rss-display-config.js # 源展示配置
├── router.tsx            # 路由配置
└── App.tsx               # 应用入口
```

## 路由设计

使用 wouter 的 HashRouter 模式（适配静态站点部署）：

| 路由 | 页面组件 | 说明 |
|------|----------|------|
| `/#/` | HomePage | 全部文章 |
| `/#/favorites` | FavoritesPage | 收藏文章（当前为占位） |
| `/#/history` | HistoryPage | 阅读历史 |
| `/#/settings` | SettingsPage | 设置 |
| `/#/sources` | SourcesPage | 订阅源管理 |
| `/#/about` | AboutPage | 关于页面 |
| `/#/article/:id` | ArticlePage | 文章详情 |

**未接入路由的页面**：
- `StarredPage` (`src/pages/starred-page.tsx`) - 更完整的收藏页面，可替换 FavoritesPage

## 关键技术决策

### 1. 为什么选择 IndexedDB 而非 localStorage

- **容量**: IndexedDB 支持数百 MB，localStorage 仅 5-10MB
- **性能**: IndexedDB 支持索引和异步查询，适合大量数据
- **结构化**: 支持复杂对象存储和关系查询

### 2. 搜索策略

由于 RSS 数据是静态 JSON 文件，采用分层搜索策略:

1. **内存搜索**: 已加载的源数据在内存中使用 fuse.js 实时搜索
2. **结果缓存**: 搜索结果在组件内缓存

### 3. 数据同步策略

- **读时合并**: 每次读取时合并构建数据与客户端状态
- **写时分离**: 用户行为只写入 IndexedDB，不影响静态文件
- **懒加载**: 图片使用 Intersection Observer 懒加载

### 4. 布局系统

支持六种布局模式：
- 卡片布局 (Card) - 默认
- 紧凑布局 (Compact)
- 网格布局 (Grid) - 图片居中
- 瀑布流布局 (Masonry) - 图片居中
- 杂志布局 (Magazine) - 图片居中
- 文本布局 (Text)

布局偏好持久化到 localStorage。

### 5. 路由模式

使用 **HashRouter** (`wouter`)：
- 所有路由前缀 `/#/`
- 兼容静态站点部署（GitHub Pages、Vercel、阿里云 ESA）
- URL 示例: `http://localhost:3001/#/?source=__all__`
- 支持标准查询参数和 Hash 路由查询参数

## 兼容性考虑

### 向后兼容

- 现有 `rss-config.js` 保持不变
- GitHub Actions 工作流无需修改
- 无用户数据的用户可正常使用基础功能

### 降级方案

- IndexedDB 不可用时降级到 localStorage（限制功能）
- 文件 API 不可用时禁用 OPML 导入
