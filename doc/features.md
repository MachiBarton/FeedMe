# 功能模块设计文档

本文档详细描述 FeedMe 各功能模块的设计方案。

## 1. 文章展示模块

### 1.1 多种布局模式

**支持布局**
1. **卡片布局** - 默认布局，展示文章封面图、标题、摘要
2. **紧凑布局** - 精简列表，适合快速浏览
3. **网格布局** - 网格卡片，图片居中显示
4. **瀑布流布局** - 自适应高度，图片居中
5. **杂志布局** - 头条大图+列表，图片居中
6. **文本布局** - 纯文字列表，极简风格

**实现组件**
- `RSSFeed` - 主 feed 组件，包含所有布局
- `ArticleCard` - 文章卡片组件
- `LazyImage` - 懒加载图片组件

### 1.2 图片处理

**懒加载策略**
- 使用 Intersection Observer 实现图片懒加载
- 从文章内容中提取图片 URL
- 图片使用 `object-contain` 保持比例并居中

## 2. 文章交互模块

### 2.1 文章排序

**功能描述**
- 支持多种排序方式：最新优先、最早优先、按来源、按标题
- 通过排序选择器切换

**实现**
- `ArticleFilter` 组件提供排序选项
- `sortArticles` 函数执行排序逻辑

## 3. 源管理模块

### 3.1 源切换器

**功能描述**
- 下拉选择当前显示的 RSS 源
- 支持"全部文章"选项 (source=__all__)
- URL 参数控制: `?source=xxx` 或 `/#/?source=xxx`

**实现**
- `SourceSwitcher` 组件
- 支持标准查询参数和 Hash 路由查询参数

### 3.2 源管理页面

**功能列表**
- 查看所有内置源和自定义源
- 按分类显示订阅源
- 添加/删除自定义 RSS 源

**路由**
- `/#/sources` - 源管理页面

## 4. 搜索与过滤模块

### 4.1 全局搜索

**搜索范围**
- 文章标题
- AI 生成的摘要
- 原文内容

**实现**
- `SearchBar` 组件
- `lib/search.ts` 搜索逻辑
- 使用 fuse.js 实现模糊搜索

## 5. 导航模块

### 5.1 侧边栏导航

**功能描述**
- 桌面端左侧固定侧边栏
- 支持折叠/展开
- 显示当前激活项

**导航项配置** (`sidebar.tsx`)
| ID | 标签 | 路径 | 状态 |
|----|------|------|------|
| home | 全部文章 | `/#/` | 正常 |
| sources | 订阅源 | `/#/sources` | 正常 |
| settings | 设置 | `/#/settings` | 正常 |
| about | 关于 | `/#/about` | 正常 |

### 5.2 移动端底部导航

**功能描述**
- 移动端底部固定导航栏
- 显示主要导航项
- 更多菜单抽屉

### 5.3 文章详情页

**功能描述**
- 独立文章详情页
- 支持 HTML 展示和 iframe 嵌入
- 通过 `rss-display-config.js` 配置各源展示方式

**实现**
- 独立路由 `/#/article/:id`
- `ArticlePage` 组件
- 使用文章 ID（sourceUrl + link 的 base64 编码）作为路由参数

## 6. 设置模块

### 6.1 主题设置

**功能描述**
- 亮色/暗色/系统主题切换
- 主题状态持久化到 localStorage

**实现**
- `ThemeProvider` 组件
- `ThemeToggle` 切换器
- 使用 CSS 变量实现主题

### 6.2 布局设置

**功能描述**
- 切换文章列表布局模式
- 支持六种布局：卡片、紧凑、网格、瀑布流、杂志、文本

**实现**
- 使用 localStorage 保存用户偏好
- `usePreferences` hook 管理布局状态

### 6.3 数据管理

**功能**
- 清除所有数据
- OPML 导入/导出

## 7. 无限滚动

### 7.1 功能描述
- 滚动到底部自动加载更多
- 显示加载动画
- 支持手动加载更多按钮

### 7.2 实现
- `InfiniteArticleList` 组件
- `useInfiniteScroll` hook
- `useIntersectionInfiniteScroll` 基于 Intersection Observer 的实现

## 8. 路由系统

### 8.1 路由配置

**注册的路由** (`src/App.tsx` 和 `src/router.tsx`)
```typescript
<Switch>
  <Route path="/" component={HomePage} />
  <Route path="/settings" component={SettingsPage} />
  <Route path="/sources" component={SourcesPage} />
  <Route path="/about" component={AboutPage} />
  <Route path="/article/:id" component={ArticlePage} />
</Switch>
```

### 8.2 路由模式

使用 **HashRouter** 模式 (`wouter`)：
- 所有路由以 `/#/` 开头
- 适配静态站点部署（GitHub Pages、Vercel 等）
- URL 示例: `http://localhost:3001/#/?source=__all__`

## 功能状态汇总

### 已实现功能
1. 多种布局展示（卡片、紧凑、网格、瀑布流、杂志、文本）
2. 文章排序（最新优先、最早优先、按来源、按标题）
3. 源切换器
4. 源管理页面（添加/删除自定义源）
5. 文章详情页（支持 HTML 和 iframe 展示）
6. 无限滚动
7. 本地搜索
8. 主题切换
9. 图片懒加载
10. OPML 导入/导出

### 已移除功能
- 已读/未读标记
- 收藏功能
- 阅读历史
- 阅读进度保存

### 待完善
1. OPML 导入/导出增强
2. 搜索功能增强
3. 性能优化
