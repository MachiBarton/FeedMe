# 数据模型设计文档

本文档定义 FeedMe 应用中使用的所有数据类型和结构。

## 现有类型（构建时数据）

### FeedItem

```typescript
export interface FeedItem {
  title: string
  link?: string
  pubDate?: string
  isoDate?: string
  content?: string
  contentSnippet?: string
  creator?: string
  summary?: string
  enclosure?: {
    url: string
    type: string
  }
}
```

### FeedData

```typescript
export interface FeedData {
  sourceUrl: string
  title: string
  description: string
  link: string
  items: FeedItem[]
  lastUpdated: string
}
```

## 客户端数据类型

### 用户自定义源

```typescript
export interface UserSource {
  id: string
  url: string
  title: string
  description?: string
  category?: string
  icon?: string
  createdAt: number
  updatedAt: number
  lastFetchedAt?: number
  fetchError?: string
  isActive: boolean
  sortOrder: number
}
```

### 用户偏好设置

```typescript
export interface UserPreferences {
  id: 'default'
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  fontFamily: 'sans' | 'serif' | 'mono'
  lineHeight: 'compact' | 'normal' | 'relaxed'
  articleLayout: 'card' | 'compact' | 'grid' | 'masonry' | 'magazine' | 'text'
  sortBy: 'date' | 'source' | 'title'
  sortOrder: 'asc' | 'desc'
  itemsPerPage: number
  fetchInterval: number
  maxArticlesPerSource: number
  createdAt: number
  updatedAt: number
}

// 默认值
export const DEFAULT_PREFERENCES: UserPreferences = {
  id: 'default',
  theme: 'system',
  fontSize: 'medium',
  fontFamily: 'sans',
  lineHeight: 'normal',
  articleLayout: 'card',
  sortBy: 'date',
  sortOrder: 'desc',
  itemsPerPage: 20,
  fetchInterval: 3600000,
  maxArticlesPerSource: 50,
  createdAt: 0,
  updatedAt: 0,
}
```

### 搜索结果

```typescript
export interface SearchResult {
  articleId: string
  title: string
  link: string
  sourceId: string
  sourceTitle: string
  pubDate?: string
  contentSnippet: string
  matchType: 'title' | 'content' | 'author'
  relevanceScore: number
}
```

### OPML 处理

```typescript
export interface OPMLSource {
  title: string
  xmlUrl: string
  htmlUrl?: string
  category?: string
}

export interface OPMLParseResult {
  sources: OPMLSource[]
  totalCount: number
  validCount: number
  invalidUrls: string[]
  categories: string[]
}

export interface OPMLExportResult {
  xmlContent: string
  exportCount: number
}
```

## IndexedDB Schema

### 数据库配置

```typescript
const DB_CONFIG = {
  name: 'FeedMeDB',
  version: 2,
  stores: {
    user_sources: {
      keyPath: 'id',
      indexes: [
        { name: 'by-url', keyPath: 'url', unique: true },
        { name: 'by-category', keyPath: 'category', unique: false },
        { name: 'by-sort-order', keyPath: 'sortOrder', unique: false },
      ],
    },
    user_preferences: {
      keyPath: 'id',
    },
  },
}
```

### Store 说明

| Store 名称 | 主键 | 索引 | 说明 |
|-----------|------|------|------|
| `user_sources` | `id` | `by-url`, `by-category`, `by-sort-order` | 用户自定义 RSS 源 |
| `user_preferences` | `id` | - | 用户偏好设置 |

## localStorage 数据

### 存储键值

| Key | 类型 | 说明 |
|-----|------|------|
| `feedme:preferences` | JSON | 用户偏好设置（主题、布局） |
| `feedme:sidebar-collapsed` | boolean | 侧边栏折叠状态 |
| `feedme:theme` | string | 主题设置 |
| `feedme:layout-mode` | string | 文章列表布局模式 |
| `feedme:custom-sources` | JSON | 自定义 RSS 源（备用） |

### 数据格式

```typescript
// feedme:preferences
{
  "theme": "system",  // 'system' | 'light' | 'dark'
  "articleLayout": "card",   // 'card' | 'compact' | 'grid' | 'masonry' | 'magazine' | 'text'
  "sidebarCollapsed": false
}
```

## 数据关系

```
┌─────────────────────────────────────────────────────────────┐
│                        数据关系                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────┐         ┌──────────────┐                │
│   │  BuiltIn     │         │  UserSource  │                │
│   │  Source      │         │(IndexedDB)   │                │
│   │(rss-config)  │         │              │                │
│   └──────┬───────┘         └──────┬───────┘                │
│          │                        │                        │
│          └──────────┬─────────────┘                        │
│                     ▼                                       │
│            ┌──────────────┐                                │
│            │Merged Sources│                                │
│            └──────────────┘                                │
│                     │                                       │
│                     ▼                                       │
│   ┌────────────────────────────────────┐                   │
│   │  FeedData (JSON 文件)               │                   │
│   │  - items: FeedItem[]                │                   │
│   │  - sourceUrl, title, etc.           │                   │
│   └────────────────────────────────────┘                   │
│                     │                                       │
│                     ▼                                       │
│   ┌────────────────────────────────────┐                   │
│   │  文章展示组件                        │                   │
│   │  - RSSFeed                          │                   │
│   │  - ArticleCard                      │                   │
│   └────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 数据操作

### 读取流程

1. **加载文章列表**
   ```
   读取 FeedData (JSON) ──► 渲染
   ```

2. **搜索文章**
   ```
   加载 FeedData ──► 内存搜索 (fuse.js) ──► 返回结果
   ```

### 写入流程

1. **更新偏好设置**
   ```
   用户操作 ──► 写入 localStorage ──► 实时生效
   ```

2. **添加自定义源**
   ```
   用户操作 ──► 写入 IndexedDB ──► 更新源列表
   ```

## 类型定义文件

所有类型定义位于 `src/lib/types.ts`：

```typescript
// 构建时数据类型
export interface FeedItem { ... }
export interface FeedData { ... }

// 客户端数据类型
export interface UserSource { ... }
export interface UserPreferences { ... }
export interface SearchResult { ... }
export interface OPMLSource { ... }
```

## 已移除的类型

以下类型在版本更新中已移除：

- `ArticleState` - 文章已读/收藏状态
- `ReadingHistory` - 阅读历史记录
- `ReadingProgress` - 阅读进度
- `SearchCache` - 搜索缓存
