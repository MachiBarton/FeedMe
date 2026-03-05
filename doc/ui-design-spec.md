# UI 设计规范文档

本文档定义 FeedMe RSS 阅读器的 UI 设计规范，确保界面的一致性和用户体验的统一。

## 1. 设计原则

### 1.1 设计目标

- **简洁优先**：减少视觉干扰，突出内容
- **内容为王**：让 RSS 文章成为视觉焦点
- **高效浏览**：快速扫描、快速切换
- **沉浸阅读**：阅读时无干扰

### 1.2 设计价值观

| 原则 | 描述 |
|------|------|
| 清晰 | 信息层级分明，一眼可辨 |
| 一致 | 相同功能使用相同交互模式 |
| 反馈 | 操作有即时反馈，状态可见 |
| 包容 | 支持亮色/暗色模式，适配不同设备 |

## 2. 色彩系统

### 2.1 基础颜色

FeedMe 使用 shadcn/ui 的 CSS 变量系统，基于 HSL 颜色格式。

#### 主色调

```css
/* 主色 - 用于主要操作、激活状态 */
--primary: 222 47% 31%;        /* 深蓝灰 */
--primary-foreground: 210 40% 98%;

/* 次色 - 用于次要操作 */
--secondary: 210 40% 96%;
--secondary-foreground: 222 47% 31%;
```

#### 语义颜色

```css
/* 成功 - 已读标记、成功提示 */
--success: 142 76% 36%;
--success-foreground: 210 40% 98%;

/* 警告 - 错误源、警告提示 */
--warning: 38 92% 50%;
--warning-foreground: 222 47% 11%;

/* 危险 - 删除操作、错误 */
--destructive: 0 84% 60%;
--destructive-foreground: 210 40% 98%;

/* 信息 - 提示信息 */
--info: 221 83% 53%;
--info-foreground: 210 40% 98%;
```

#### 中性色

```css
/* 背景 */
--background: 0 0% 100%;
--foreground: 222 47% 11%;

/* 卡片 */
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;

/* 边框和分隔 */
--border: 214 32% 91%;
--input: 214 32% 91%;
--ring: 222 47% 31%;

/* 弱化文字 */
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;
```

### 2.2 暗色模式

```css
.dark {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;

  --card: 222 47% 14%;
  --card-foreground: 210 40% 98%;

  --border: 217 33% 25%;
  --input: 217 33% 25%;

  --muted: 223 47% 18%;
  --muted-foreground: 215 20% 65%;
}
```

### 2.3 颜色使用规范

| 场景 | 颜色变量 | 说明 |
|------|----------|------|
| 主要按钮 | `--primary` | 保存、确认、主要操作 |
| 次要按钮 | `--secondary` | 取消、返回 |
| 危险操作 | `--destructive` | 删除、移除源 |
| 未读标记 | `--primary` | 蓝色侧边条 |
| 收藏状态 | `--warning` | 黄色星标 |
| 已读文字 | `--muted-foreground` | 灰色标题 |
| 分隔线 | `--border` | 浅色边框 |

## 3. 排版规范

### 3.1 字体栈

```css
/* 中文优先 */
font-family:
  "PingFang SC",           /* macOS/iOS 苹方 */
  "Hiragino Sans GB",      /* macOS 冬青黑体 */
  "Microsoft YaHei",       /* Windows 微软雅黑 */
  "Noto Sans SC",          /* Linux/Android */
  sans-serif;
```

### 3.2 字体大小

| 层级 | 大小 | 字重 | 用途 |
|------|------|------|------|
| 页面标题 | 2rem (32px) | 700 | FeedMe Logo |
| 模块标题 | 1.5rem (24px) | 600 | 源名称、设置分组 |
| 卡片标题 | 1.25rem (20px) | 600 | 文章标题 |
| 正文 | 1rem (16px) | 400 | 文章内容、描述 |
| 小字 | 0.875rem (14px) | 400 | 日期、作者、标签 |
| 极小字 | 0.75rem (12px) | 400 | 更新时间、提示 |

### 3.3 行高

| 场景 | 行高 | 说明 |
|------|------|------|
| 标题 | 1.25 | 紧凑，突出层级 |
| 正文 | 1.6 | 舒适阅读 |
| 文章摘要 | 1.75 | 大段文字，需要呼吸感 |
| 列表项 | 1.5 | 平衡扫描和阅读 |

### 3.4 字体调整功能

提供四级字体大小调整：

```typescript
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

const fontSizeMap = {
  small: { base: '14px', title: '18px', article: '15px' },
  medium: { base: '16px', title: '20px', article: '16px' },
  large: { base: '18px', title: '22px', article: '17px' },
  xlarge: { base: '20px', title: '24px', article: '18px' },
};
```

## 4. 间距系统

### 4.1 基础单位

基础间距单位为 **4px**（Tailwind 默认）。

### 4.2 常用间距

| Token | 值 | 用途 |
|-------|-----|------|
| space-1 | 4px | 图标与文字间距 |
| space-2 | 8px | 紧凑间距、内联元素 |
| space-3 | 12px | 卡片内边距（小）|
| space-4 | 16px | 卡片内边距（标准）|
| space-6 | 24px | 模块间距 |
| space-8 | 32px | 大模块间距 |
| space-10 | 40px | 页面级间距 |

### 4.3 布局间距

```
页面布局
┌─────────────────────────────────────┐
│  容器边距: 16px (移动端) / 24px (桌面) │
├─────────────────────────────────────┤
│                                     │
│  模块间距: 24px                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 卡片内边距: 16px / 24px      │    │
│  │                             │    │
│  │ 元素间距: 12px              │    │
│  │                             │    │
│  │ ┌────┐ 文字间距: 8px ┌────┐ │    │
│  │ │图标│ ───────────── │按钮│ │    │
│  │ └────┘              └────┘ │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### 4.4 容器规范

| 容器 | 最大宽度 | 内边距 |
|------|----------|--------|
| 页面容器 | 896px (max-w-4xl) | px-4 md:px-6 |
| 卡片 | 100% | p-4 md:p-6 |
| 侧边栏 | 280px | p-4 |
| 弹窗 | 480px / 640px | p-6 |

## 5. 组件规范

### 5.1 文章卡片

#### 结构

```
┌─────────────────────────────────────────────────────────┐
│ ■ 未读指示                                                │
│                                                         │
│ 文章标题（点击跳转）                          [☆] [👁]    │
│ 2024-01-01 · 作者名称                                    │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [摘要] [原文]                                        │ │
│ │                                                     │ │
│ │ AI 生成的摘要内容...                                  │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 样式规范

```typescript
// 卡片基础样式
const cardStyles = {
  base: "rounded-lg border bg-card shadow-sm",
  padding: "p-4 md:p-6",
  hover: "hover:shadow-md transition-shadow",

  // 未读状态
  unread: {
    indicator: "absolute left-0 top-4 w-1 h-12 bg-primary rounded-r",
    title: "text-foreground font-semibold",
  },

  // 已读状态
  read: {
    title: "text-muted-foreground font-normal",
  },

  // 收藏状态
  favorite: {
    icon: "fill-warning text-warning",
  },
};
```

#### 交互规范

| 操作 | 交互 | 反馈 |
|------|------|------|
| 点击标题 | 新标签页打开原文 | 外部链接图标 |
| 点击收藏 | 切换收藏状态 | 星标填充动画 |
| 点击标记已读 | 标记为已读 | 未读指示消失 |
| 切换标签 | 显示摘要/原文 | 淡入过渡 |

### 5.2 侧边栏导航

#### 结构（桌面端）

```
┌──────────────────┐
│ 😋 FeedMe        │ Logo: text-2xl font-bold
├──────────────────┤
│ 📰 全部文章      │ 导航项: py-2 px-3 rounded-md
│ 🔵 未读文章 (12) │ 悬停: bg-muted
├──────────────────┤
│ 📂 我的订阅      │ 分组标题: text-xs font-medium text-muted-foreground
│   ○ 科技资讯     │ 子项: pl-4 py-1.5
│   ○ 技术博客     │ 选中: bg-primary text-primary-foreground
└──────────────────┘
```

#### 样式规范

```typescript
const sidebarStyles = {
  container: "w-[280px] h-screen border-r bg-background",

  section: {
    base: "px-3 py-2",
    title: "mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase",
  },

  navItem: {
    base: "flex items-center gap-3 px-3 py-2 rounded-md text-sm",
    hover: "hover:bg-muted cursor-pointer",
    active: "bg-primary text-primary-foreground",
    icon: "w-5 h-5",
    badge: "ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full",
  },
};
```

### 5.3 搜索栏

#### 结构

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐   │
│ │ 🔍 搜索文章...                              ⌘K      │   │
│ └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

#### 样式规范

```typescript
const searchBarStyles = {
  container: "relative w-full max-w-2xl",
  input: {
    base: "w-full h-11 pl-10 pr-16 rounded-full border bg-background",
    focus: "focus:ring-2 focus:ring-primary/20 focus:border-primary",
    placeholder: "text-muted-foreground",
  },
  icon: "absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground",
  shortcut: "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground border rounded px-1.5 py-0.5",
};
```

#### 搜索下拉面板

```
┌──────────────────────────────────────────────────────────────┐
│ "人工智能"                                                   │
├──────────────────────────────────────────────────────────────┤
│ 最近搜索                                              清除   │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ 🔍 机器学习                                           │    │
│ │ 🔍 ChatGPT                                            │    │
│ └──────────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────────┤
│ 搜索结果 (23)                                                │
│ ┌──────────────────────────────────────────────────────┐    │
│ │ [AI摘要] 文章标题...                                  │    │
│ │     来源: 科技资讯 · 匹配: 摘要                        │    │
│ ├──────────────────────────────────────────────────────┤    │
│ │ [原文] 另一篇文章...                                  │    │
│ │     来源: 技术博客 · 匹配: 标题                        │    │
│ └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 源选择器

#### 结构

```
┌─────────────────────────────────┐
│ 选择信息源              ▼       │ 触发按钮
└─────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────┐
│ 🔍 搜索信息源...                │
├─────────────────────────────────┤
│ 科技资讯                        │ 分组标题
│ ✓ Hacker News 近期最佳          │
│   OpenAI News                   │
│   ...                           │
├─────────────────────────────────┤
│ 技术博客                        │
│   Hugging Face 博客             │
│   ...                           │
└─────────────────────────────────┘
```

### 5.5 设置页面

#### 布局

```
┌──────────────────────────────────────────────────────────────┐
│ ⚙️ 设置                                                      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 外观                                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 主题                                    [系统 ▼]        │ │
│ │ 字体大小                                [中 ▼]          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 阅读                                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 每页显示文章数                          [10 ▼]          │ │
│ │ 自动标记已读                            [开关]          │ │
│ │ 自动标记延迟                            [3秒 ▼]         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ 数据管理                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [导入 OPML]  [导出 OPML]  [导出所有数据]  [清除数据]    │ │
│ │                                                         │ │
│ │ 存储使用: 12.5 MB / 50 MB                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

#### 设置项卡片规范

```typescript
const settingSectionStyles = {
  container: "space-y-6",
  section: {
    base: "space-y-4",
    title: "text-lg font-semibold",
    card: "rounded-lg border bg-card p-4 space-y-4",
  },
  item: {
    base: "flex items-center justify-between py-2",
    label: "flex flex-col gap-1",
    title: "font-medium",
    description: "text-sm text-muted-foreground",
  },
};
```

## 6. 图标规范

### 6.1 图标库

使用 **Lucide React** 图标库。

### 6.2 图标尺寸

| 场景 | 尺寸 | 用途 |
|------|------|------|
| xs | 14px | 内联小图标 |
| sm | 16px | 按钮内图标 |
| md | 20px | 导航图标 |
| lg | 24px | 独立图标 |
| xl | 32px | 空状态/大图标 |

### 6.3 常用图标映射

| 功能 | 图标 | 备注 |
|------|------|------|
| 搜索 | `Search` | 搜索栏 |
| 收藏 | `Star` | 空心/实心切换 |
| 已读 | `Check` / `CheckCheck` | 单勾/双勾 |
| 设置 | `Settings` | 设置入口 |
| 主题 | `Sun` / `Moon` | 亮/暗切换 |
| 源/订阅 | `Rss` | 订阅相关 |
| 历史 | `History` | 阅读历史 |
| 未读 | `Circle` | 未读指示 |
| 外部链接 | `ExternalLink` | 跳转到原文 |
| 返回顶部 | `ArrowUp` | 回到顶部 |
| 更多 | `MoreVertical` | 更多操作 |
| 删除 | `Trash2` | 删除操作 |
| 添加 | `Plus` | 添加源 |
| 导入 | `Upload` | 导入数据 |
| 导出 | `Download` | 导出数据 |

## 7. 动效规范

### 7.1 过渡时长

| 时长 | 用途 |
|------|------|
| 150ms | 快速反馈（按钮点击、颜色变化）|
| 200ms | 标准过渡（悬停、开关）|
| 300ms | 复杂动画（弹窗、下拉）|
| 500ms | 页面级过渡 |

### 7.2 缓动函数

```css
/* 标准 */
transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);

/* 减速（进入）*/
transition-timing-function: cubic-bezier(0, 0, 0.2, 1);

/* 加速（退出）*/
transition-timing-function: cubic-bezier(0.4, 0, 1, 1);

/* 弹性 */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### 7.3 常用动效

```typescript
const transitions = {
  // 颜色/背景变化
  color: "transition-colors duration-200",

  // 透明度变化
  opacity: "transition-opacity duration-200",

  // 变换（位移/缩放）
  transform: "transition-transform duration-200",

  // 阴影变化
  shadow: "transition-shadow duration-200",

  // 全部属性
  all: "transition-all duration-200",

  // 弹窗进入
  modalEnter: "animate-in fade-in zoom-in-95 duration-200",

  // 下拉菜单
  dropdown: "animate-in fade-in slide-in-from-top-2 duration-200",

  // 骨架屏脉冲
  skeleton: "animate-pulse",

  // 旋转
  spin: "animate-spin",
};
```

### 7.4 微交互

| 场景 | 动效 |
|------|------|
| 按钮悬停 | 背景色加深，上移 1px |
| 卡片悬停 | 阴影加深 |
| 收藏点击 | 星标放大弹回 + 填充变色 |
| 标记已读 | 未读指示条滑出 |
| 加载更多 | 底部加载动画 + 内容淡入 |
| 下拉刷新 | 顶部旋转指示器 |

## 8. 响应式设计

### 8.1 断点

| 断点 | 宽度 | 设备 |
|------|------|------|
| sm | 640px | 大手机 |
| md | 768px | 平板 |
| lg | 1024px | 小桌面 |
| xl | 1280px | 标准桌面 |
| 2xl | 1536px | 大桌面 |

### 8.2 布局适配

#### 桌面端 (lg+)

```
┌──────────┬─────────────────────────────────────┐
│          │                                     │
│ 侧边栏    │           主内容区                   │
│ 280px    │           max-w-4xl                 │
│          │                                     │
└──────────┴─────────────────────────────────────┘
```

#### 平板端 (md)

```
┌─────────────────────────────────────────────────┐
│ 顶部导航栏（简化版）                              │
├─────────────────────────────────────────────────┤
│                                                 │
│              主内容区                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 手机端 (<md)

```
┌─────────────────────────────────────────────────┐
│ FeedMe                        [🔍] [☀️]        │
├─────────────────────────────────────────────────┤
│                                                 │
│ 主内容区（全宽）                                  │
│                                                 │
├─────────────────────────────────────────────────┤
│ 🏠      📰      ⭐      ⚙️                       │
│ 首页    订阅    收藏    设置                      │
└─────────────────────────────────────────────────┘
```

### 8.3 响应式规则

| 元素 | 桌面 | 平板 | 手机 |
|------|------|------|------|
| 侧边栏 | 固定显示 | 隐藏，汉堡菜单 | 底部导航 |
| 文章卡片 | p-6 | p-5 | p-4 |
| 卡片网格 | 单列 | 单列 | 单列 |
| 搜索栏 | 常驻顶部 | 常驻顶部 | 点击展开 |
| 字体大小 | base | base | sm |

## 9. 状态与反馈

### 9.1 加载状态

#### 骨架屏

```typescript
const skeletonStyles = {
  base: "animate-pulse bg-muted rounded",
  title: "h-6 w-3/4",
  line: "h-4 w-full",
  lineShort: "h-4 w-4/5",
  avatar: "h-10 w-10 rounded-full",
  card: "h-32 w-full rounded-lg",
};
```

#### 加载指示器

- 局部加载：小型旋转图标（`Loader2` + `animate-spin`）
- 页面加载：骨架屏
- 无限滚动：底部加载动画

### 9.2 空状态

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                         📭                                  │
│                                                             │
│                    暂无收藏文章                              │
│              点击星标收藏你感兴趣的文章                       │
│                                                             │
│                    [去浏览]                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 错误状态

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ 数据加载失败                                              │
│  请检查数据源是否出错，或稍后重试                              │
│                                                             │
│              [重新加载]                                      │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Toast 提示

| 类型 | 图标 | 颜色 | 使用场景 |
|------|------|------|----------|
| 成功 | `CheckCircle` | `--success` | 操作成功 |
| 错误 | `XCircle` | `--destructive` | 操作失败 |
| 警告 | `AlertTriangle` | `--warning` | 需要注意 |
| 信息 | `Info` | `--info` | 一般提示 |

## 10. 无障碍规范

### 10.1 键盘导航

- `Tab` / `Shift+Tab`: 在可交互元素间切换
- `Enter` / `Space`: 激活按钮或链接
- `Escape`: 关闭弹窗、下拉菜单
- `Cmd/Ctrl + K`: 打开搜索
- `Cmd/Ctrl + B`: 切换侧边栏

### 10.2 ARIA 标签

```tsx
// 按钮
<button aria-label="收藏文章">
  <Star />
</button>

// 导航
<nav aria-label="主导航">
  <a aria-current="page">当前页面</a>
</nav>

// 搜索
<input
  role="searchbox"
  aria-label="搜索文章"
  aria-expanded={isOpen}
/>

// 加载状态
<div role="status" aria-live="polite">
  正在加载...
</div>
```

### 10.3 对比度

- 正文文字与背景对比度 ≥ 4.5:1
- 大文字（18px+）对比度 ≥ 3:1
- 交互元素对比度 ≥ 3:1

## 11. 文件命名规范

### 11.1 组件文件

```
components/
├── ui/                      # shadcn/ui 组件
│   ├── button.tsx
│   └── card.tsx
├── rss-feed.tsx            # RSS 信息流
├── source-switcher.tsx     # 源选择器
├── search-bar.tsx          # 搜索栏
├── sidebar.tsx             # 侧边栏
├── article-card.tsx        # 文章卡片
└── settings/
    ├── index.tsx           # 设置页面
    ├── opml-import.tsx     # OPML 导入
    └── source-manager.tsx  # 源管理
```

### 11.2 工具文件

```
lib/
├── db.ts                   # IndexedDB
├── opml.ts                 # OPML 处理
├── search.ts               # 搜索功能
├── utils.ts                # 通用工具
└── constants.ts            # 常量定义
```

### 11.3 Hooks 文件

```
hooks/
├── use-articles.ts
├── use-search.ts
├── use-preferences.ts
└── use-navigation.ts
```

## 12. 代码示例

### 12.1 完整文章卡片组件

```tsx
// components/article-card.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/types";

interface ArticleCardProps {
  item: FeedItem;
  index: number;
  isRead: boolean;
  isFavorite: boolean;
  onToggleRead: () => void;
  onToggleFavorite: () => void;
}

export function ArticleCard({
  item,
  index,
  isRead,
  isFavorite,
  onToggleRead,
  onToggleFavorite,
}: ArticleCardProps) {
  return (
    <Card className={cn(
      "feed-card relative",
      "transition-shadow duration-200",
      "hover:shadow-md"
    )}>
      {/* 未读指示器 */}
      {!isRead && (
        <div className="absolute left-0 top-4 w-1 h-12 bg-primary rounded-r" />
      )}

      {/* 序号 */}
      <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center
                      rounded-full bg-primary text-primary-foreground font-bold shadow-md">
        {index + 1}
      </div>

      <CardHeader className="pl-6">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className={cn(
            "text-xl transition-colors duration-200",
            isRead ? "text-muted-foreground font-normal" : "text-foreground font-semibold"
          )}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-2"
              onClick={onToggleRead}
            >
              {item.title}
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </a>
          </CardTitle>

          {/* 操作按钮组 */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "取消收藏" : "收藏"}
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-all duration-200",
                  isFavorite && "fill-warning text-warning scale-110"
                )}
              />
            </Button>
            {!isRead && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onToggleRead}
                aria-label="标记已读"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 元信息 */}
        <div className="text-sm text-muted-foreground">
          {new Date(item.pubDate || "").toLocaleString("zh-CN")}
          {item.creator && ` · ${item.creator}`}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="mb-4">
            <TabsTrigger value="summary">AI 摘要</TabsTrigger>
            <TabsTrigger value="original">原文内容</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-2">
            <div className="text-sm text-muted-foreground mb-2">
              由 AI 生成的摘要：
            </div>
            <div className="text-foreground whitespace-pre-line leading-relaxed">
              {item.summary || "无法生成摘要。"}
            </div>
          </TabsContent>

          <TabsContent value="original">
            <div
              className="text-sm prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{
                __html: item.content || "无内容",
              }}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
```

### 12.2 按钮变体使用

```tsx
// 主要操作
<Button>保存更改</Button>

// 次要操作
<Button variant="secondary">取消</Button>

// 危险操作
<Button variant="destructive">删除</Button>

// 幽灵按钮（图标按钮）
<Button variant="ghost" size="icon">
  <Star />
</Button>

// 轮廓按钮
<Button variant="outline">导出</Button>

// 链接样式
<Button variant="link">查看更多</Button>
```

---

## 附录

### A. Tailwind 常用类速查

```
布局
├── flex, grid, block, inline
├── items-center, justify-between
├── gap-2, gap-4, gap-6
└── container, mx-auto, max-w-4xl

间距
├── p-4, px-4, py-2 (padding)
├── m-4, mx-auto, my-2 (margin)
├── space-y-4, space-x-2
└── w-full, h-screen, min-h-screen

外观
├── rounded, rounded-lg, rounded-full
├── shadow, shadow-sm, shadow-md
├── border, border-t, border-b
└── bg-background, text-foreground

文字
├── text-sm, text-base, text-lg
├── font-normal, font-medium, font-semibold
├── text-muted-foreground, text-primary
└── truncate, line-clamp-2

交互
├── hover:bg-muted, hover:shadow-md
├── focus:ring-2, focus:outline-none
├── cursor-pointer, select-none
└── transition, duration-200, ease-in-out

状态
├── disabled:opacity-50, disabled:cursor-not-allowed
├── animate-pulse, animate-spin
└── hidden, invisible, sr-only
```

### B. 快速参考卡片

```tsx
// 标准容器
<div className="container mx-auto max-w-4xl px-4 md:px-6">

// 卡片样式
<div className="rounded-lg border bg-card p-4 md:p-6 shadow-sm">

// 弹性布局
<div className="flex items-center justify-between gap-4">

// 网格布局
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

// 文字截断
<h2 className="truncate text-lg font-semibold">

// 多行截断
<p className="line-clamp-3 text-sm text-muted-foreground">

// 悬停效果
<button className="hover:bg-muted transition-colors duration-200">

// 响应式显示
<div className="hidden md:block">桌面端显示</div>
<div className="md:hidden">移动端显示</div>
```
