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

export interface Feed {
  title: string
  description: string
  link: string
  items: FeedItem[]
}

export interface FeedData {
  sourceUrl: string
  title: string
  description: string
  link: string
  items: FeedItem[]
  lastUpdated: string
}

// ============================================
// User Source - 用户自定义 RSS 源
// ============================================
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

// ============================================
// User Preferences - 用户偏好设置
// ============================================
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

// ============================================
// OPML Processing - OPML 处理
// ============================================
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

// ============================================
// IndexedDB Store Names
// ============================================
export type StoreName =
  | 'user_sources'
  | 'user_preferences'
