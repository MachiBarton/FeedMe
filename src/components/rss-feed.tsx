"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useSearchParams } from "@/hooks/use-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { loadFeedData, getAllArticles } from "@/lib/data-store"
import type { FeedData, FeedItem } from "@/lib/types"
import { findSourceByUrl } from "@/config/rss-config"
import { usePreferences } from "@/hooks/use-preferences"
import { LayoutSwitcher } from "@/components/layout-switcher"
import { ArticleListCard } from "@/components/article-list-card"
import { ArticleListCompact } from "@/components/article-list-compact"
import { ArticleListGrid } from "@/components/article-list-grid"
import { ArticleListMasonry } from "@/components/article-list-masonry"
import { ArticleListMagazine } from "@/components/article-list-magazine"
import { ArticleListText } from "@/components/article-list-text"
import { ArticleCardEmpty, ArticleCardSkeleton } from "@/components/article-card"
import { generateArticleId } from "@/hooks/use-articles"

const ALL_SOURCES_VALUE = "__all__"

interface AggregatedItem extends FeedItem {
  sourceUrl: string
  sourceTitle: string
}

export function RssFeed({ defaultSource }: { defaultSource: string }) {
  const searchParams = useSearchParams()
  const sourceUrl = searchParams.get("source") || defaultSource
  const isAllSources = sourceUrl === ALL_SOURCES_VALUE

  const [feedData, setFeedData] = useState<FeedData | null>(null)
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { preferences } = usePreferences()
  const articleLayout = preferences.articleLayout

  const fetchFeed = async (url: string) => {
    try {
      setLoading(true)
      setError(null)

      const cachedData = await loadFeedData(url)

      if (cachedData) {
        setFeedData(cachedData)
      } else {
        setError("数据为空，请检查数据源是否出错")
      }
    } catch (err) {
      console.error("Error fetching feed:", err)
      setError("数据获取失败，请检查数据源是否出错")
    } finally {
      setLoading(false)
    }
  }

  const fetchAllFeeds = async () => {
    try {
      setLoading(true)
      setError(null)

      const allArticles = await getAllArticles({ mergeStates: false })

      if (allArticles.length > 0) {
        setAggregatedItems(allArticles)
      } else {
        setError("暂无文章数据")
      }
    } catch (err) {
      console.error("Error fetching all feeds:", err)
      setError("数据获取失败，请检查数据源是否出错")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAllSources) {
      fetchAllFeeds()
    } else {
      fetchFeed(sourceUrl)
    }
  }, [sourceUrl, isAllSources])

  const source = findSourceByUrl(sourceUrl)
  const displayTitle = isAllSources
    ? "全部文章"
    : source?.name || feedData?.title || "信息源"

  // 获取用于显示的数据
  const displayItems = useMemo(() => {
    if (isAllSources) {
      return aggregatedItems
    }
    return feedData?.items.map(item => ({
      ...item,
      sourceUrl,
      sourceTitle: feedData.title,
    })) || []
  }, [isAllSources, aggregatedItems, feedData, sourceUrl])

  // 获取来源名称的辅助函数
  const getSourceName = useCallback((url: string) => {
    return findSourceByUrl(url)?.name
  }, [])

  // 渲染文章列表
  const renderArticleList = () => {
    const commonProps = {
      generateArticleId,
      getSourceName,
    }

    switch (articleLayout) {
      case "compact":
        return (
          <ArticleListCompact
            items={displayItems}
            {...commonProps}
          />
        )
      case "grid":
        return (
          <ArticleListGrid
            items={displayItems}
            {...commonProps}
          />
        )
      case "masonry":
        return (
          <ArticleListMasonry
            items={displayItems}
            {...commonProps}
          />
        )
      case "magazine":
        return (
          <ArticleListMagazine
            items={displayItems}
            {...commonProps}
          />
        )
      case "text":
        return (
          <ArticleListText
            items={displayItems}
            {...commonProps}
          />
        )
      case "card":
      default:
        return (
          <ArticleListCard
            items={displayItems}
            {...commonProps}
          />
        )
    }
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  const isEmpty = !loading && displayItems.length === 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{displayTitle}</h2>
          {isAllSources ? (
            <Badge variant="outline">聚合</Badge>
          ) : (
            source && <Badge variant="outline">{source.category}</Badge>
          )}
          {!isAllSources && feedData?.lastUpdated && (
            <span className="text-xs text-muted-foreground">
              更新于: {new Date(feedData.lastUpdated).toLocaleString("zh-CN")}
            </span>
          )}
        </div>
        <LayoutSwitcher />
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <ArticleCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <ArticleCardEmpty />
      ) : (
        renderArticleList()
      )}
    </div>
  )
}

export default RssFeed
