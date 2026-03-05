import { config } from "@/config/rss-config"
import type { FeedData, FeedItem, UserSource } from "@/lib/types"
import { getAllItems } from "@/lib/db"

/**
 * 从静态数据文件加载RSS数据
 * 使用fetch从public/data目录加载JSON文件
 */
export async function loadFeedData(
  sourceUrl: string
): Promise<FeedData | null> {
  try {
    // 使用URL的哈希作为文件名，与GitHub Actions中相同的逻辑
    // 使用浏览器兼容的base64编码
    const sourceHash = btoa(sourceUrl).replace(/[/+=]/g, "_")

    // 使用相对于根路径的绝对路径加载数据文件
    // 这样可以确保在任何页面（包括/article/xxx）都能正确加载
    // 兼容 GitHub Pages /FeedMe/ 部署路径
    const basePath = import.meta.env.BASE_URL || '/'
    const dataUrl = `${basePath}/data/${sourceHash}.json`

    try {
      const response = await fetch(dataUrl)

      if (!response.ok) {
        console.warn(`No data found for ${sourceUrl}`)
        return null
      }

      const data = await response.json() as FeedData
      return data
    } catch (error) {
      console.warn(`No data found for ${sourceUrl}`)
      return null
    }
  } catch (error) {
    console.error(`Error loading data for ${sourceUrl}:`, error)
    return null
  }
}

/**
 * 加载所有内置源的 Feed 数据
 */
export async function loadAllBuiltinFeeds(): Promise<FeedData[]> {
  const results = await Promise.all(
    config.sources.map(source => loadFeedData(source.url))
  )
  return results.filter((data): data is NonNullable<typeof data> => data !== null)
}

/**
 * 加载所有用户自定义源的 Feed 数据
 */
export async function loadAllUserFeeds(): Promise<FeedData[]> {
  try {
    const userSources = await getAllItems<UserSource>('user_sources')
    const activeSources = userSources.filter(s => s.isActive)

    const results = await Promise.all(
      activeSources.map(source => loadFeedData(source.url))
    )
    return results.filter((data): data is NonNullable<typeof data> => data !== null)
  } catch (error) {
    console.error('Error loading user feeds:', error)
    return []
  }
}

/**
 * 合并内置源和用户自定义源
 */
export async function getAllSources(): Promise<
  (UserSource & { type: 'builtin' | 'user' })[]
> {
  const builtinSources: (UserSource & { type: 'builtin' | 'user' })[] =
    config.sources.map((source, index) => ({
      id: btoa(source.url).replace(/[/+=]/g, '_'),
      url: source.url,
      title: source.name,
      description: '',
      category: source.category,
      createdAt: 0,
      updatedAt: 0,
      isActive: true,
      sortOrder: index,
      type: 'builtin' as const,
    }))

  try {
    const userSources = await getAllItems<UserSource>('user_sources')
    const userSourcesWithType = userSources.map(s => ({
      ...s,
      type: 'user' as const,
    }))

    // 合并并去重（以 URL 为准）
    const urlSet = new Set(builtinSources.map(s => s.url))
    const uniqueUserSources = userSourcesWithType.filter(s => !urlSet.has(s.url))

    return [...builtinSources, ...uniqueUserSources].sort(
      (a, b) => a.sortOrder - b.sortOrder
    )
  } catch (error) {
    console.error('Error loading user sources:', error)
    return builtinSources
  }
}

/**
 * 获取所有文章（合并所有源）
 */
export async function getAllArticles(
  options: {
    includeBuiltin?: boolean
    includeUser?: boolean
  } = {}
): Promise<(FeedItem & { sourceUrl: string; sourceTitle: string })[]> {
  const {
    includeBuiltin = true,
    includeUser = true,
  } = options

  const articles: (FeedItem & { sourceUrl: string; sourceTitle: string })[] = []

  if (includeBuiltin) {
    const builtinFeeds = await loadAllBuiltinFeeds()
    for (const feed of builtinFeeds) {
      articles.push(
        ...feed.items.map(item => ({
          ...item,
          sourceUrl: feed.sourceUrl,
          sourceTitle: feed.title,
        }))
      )
    }
  }

  if (includeUser) {
    const userFeeds = await loadAllUserFeeds()
    for (const feed of userFeeds) {
      articles.push(
        ...feed.items.map(item => ({
          ...item,
          sourceUrl: feed.sourceUrl,
          sourceTitle: feed.title,
        }))
      )
    }
  }

  // 按发布日期排序（最新的在前）
  return articles.sort((a, b) => {
    const dateA = a.isoDate || a.pubDate || ''
    const dateB = b.isoDate || b.pubDate || ''
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}

/**
 * 获取所有缓存的RSS源URL（包括用户自定义源）
 */
export async function getAllCachedSources(): Promise<string[]> {
  const builtinUrls = config.sources.map(source => source.url)

  try {
    const userSources = await getAllItems<UserSource>('user_sources')
    const userUrls = userSources.filter(s => s.isActive).map(s => s.url)
    return [...new Set([...builtinUrls, ...userUrls])]
  } catch (error) {
    return builtinUrls
  }
}
