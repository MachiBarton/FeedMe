"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InfiniteScrollProps {
  /** 是否正在加载 */
  isLoading: boolean
  /** 是否有更多数据 */
  hasMore: boolean
  /** 加载更多回调 */
  onLoadMore: () => void
  /** 子元素 */
  children: React.ReactNode
  /** 额外的CSS类 */
  className?: string
  /** 加载提示文本 */
  loadingText?: string
  /** 没有更多数据提示文本 */
  noMoreText?: string
  /** 距离底部多少像素时触发加载 */
  threshold?: number
  /** 是否启用虚拟列表 */
  virtualScroll?: boolean
  /** 虚拟列表项目高度 */
  itemHeight?: number
  /** 虚拟列表项目总数 */
  totalItems?: number
  /** 虚拟列表渲染项目 */
  renderItem?: (index: number) => React.ReactNode
}

/**
 * 无限滚动组件
 * 使用 Intersection Observer API 检测滚动到底部
 */
export function InfiniteScroll({
  isLoading,
  hasMore,
  onLoadMore,
  children,
  className,
  loadingText = "加载中...",
  noMoreText = "没有更多内容了",
  threshold = 100,
}: InfiniteScrollProps) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 使用 Intersection Observer 检测是否到达底部
  useEffect(() => {
    // 如果正在加载或没有更多数据，不创建 observer
    if (isLoading || !hasMore) {
      return
    }

    const element = loadMoreRef.current
    if (!element) return

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    )

    observerRef.current.observe(element)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [isLoading, hasMore, onLoadMore, threshold])

  return (
    <div className={className}>
      {children}

      {/* 加载更多触发器 */}
      <div
        ref={loadMoreRef}
        className={cn(
          "flex items-center justify-center py-4",
          (!hasMore && !isLoading) && "hidden"
        )}
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{loadingText}</span>
          </div>
        )}
      </div>

      {/* 没有更多数据 */}
      {!hasMore && !isLoading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <span className="text-sm">{noMoreText}</span>
        </div>
      )}
    </div>
  )
}

// ============================================
// 虚拟列表实现
// ============================================

interface VirtualListProps {
  /** 项目总数 */
  totalItems: number
  /** 项目高度（像素） */
  itemHeight: number
  /** 渲染项目函数 */
  renderItem: (index: number) => React.ReactNode
  /** 容器高度 */
  containerHeight?: number
  /** 额外的CSS类 */
  className?: string
  /** 缓冲区大小（上下多渲染的项目数） */
  overscan?: number
  /** 滚动位置回调 */
  onScroll?: (scrollTop: number) => void
}

/**
 * 虚拟列表组件
 * 用于优化大数据量的渲染性能
 */
export function VirtualList({
  totalItems,
  itemHeight,
  renderItem,
  containerHeight = 600,
  className,
  overscan = 5,
  onScroll,
}: VirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  // 计算可见范围
  const visibleRange = useCallback(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(totalItems, start + visibleCount + overscan),
    }
  }, [scrollTop, itemHeight, containerHeight, overscan, totalItems])

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop
      setScrollTop(newScrollTop)
      onScroll?.(newScrollTop)
    },
    [onScroll]
  )

  const { start, end } = visibleRange()
  const visibleItems = []

  for (let i = start; i < end; i++) {
    visibleItems.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        }}
      >
        {renderItem(i)}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflow: "auto" }}
      className={className}
    >
      <div style={{ height: totalItems * itemHeight, position: "relative" }}>
        {visibleItems}
      </div>
    </div>
  )
}

// ============================================
// 带虚拟列表的无限滚动
// ============================================

interface VirtualInfiniteScrollProps extends VirtualListProps {
  /** 是否正在加载 */
  isLoading: boolean
  /** 是否有更多数据 */
  hasMore: boolean
  /** 加载更多回调 */
  onLoadMore: () => void
  /** 加载提示文本 */
  loadingText?: string
  /** 没有更多数据提示文本 */
  noMoreText?: string
}

/**
 * 虚拟列表 + 无限滚动组合组件
 */
export function VirtualInfiniteScroll({
  isLoading,
  hasMore,
  onLoadMore,
  loadingText = "加载中...",
  noMoreText = "没有更多内容了",
  ...virtualListProps
}: VirtualInfiniteScrollProps) {
  const [scrollTop, setScrollTop] = useState(0)

  // 检测是否接近底部
  useEffect(() => {
    if (isLoading || !hasMore) return

    const { totalItems, itemHeight, containerHeight = 600 } = virtualListProps
    const totalHeight = totalItems * itemHeight
    const scrollBottom = scrollTop + containerHeight

    // 如果距离底部小于 200px，触发加载
    if (totalHeight - scrollBottom < 200) {
      onLoadMore()
    }
  }, [
    scrollTop,
    isLoading,
    hasMore,
    onLoadMore,
    virtualListProps.totalItems,
    virtualListProps.itemHeight,
    virtualListProps.containerHeight,
  ])

  return (
    <div className="relative">
      <VirtualList
        {...virtualListProps}
        onScroll={setScrollTop}
        renderItem={(index) => {
          // 最后一项显示加载提示
          if (index === virtualListProps.totalItems - 1) {
            return (
              <div>
                {virtualListProps.renderItem(index)}
                {(isLoading || hasMore) && (
                  <div className="flex items-center justify-center py-4">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{loadingText}</span>
                      </div>
                    ) : null}
                  </div>
                )}
                {!hasMore && !isLoading && (
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    <span className="text-sm">{noMoreText}</span>
                  </div>
                )}
              </div>
            )
          }
          return virtualListProps.renderItem(index)
        }}
      />
    </div>
  )
}

// ============================================
// Hook: 使用无限滚动
// ============================================

interface UseInfiniteScrollOptions<T> {
  /** 获取数据的函数 */
  fetchData: (page: number) => Promise<{ data: T[]; hasMore: boolean }>
  /** 初始页码 */
  initialPage?: number
  /** 每页大小 */
  pageSize?: number
}

interface UseInfiniteScrollResult<T> {
  /** 数据列表 */
  data: T[]
  /** 是否正在加载 */
  isLoading: boolean
  /** 是否有更多数据 */
  hasMore: boolean
  /** 加载更多 */
  loadMore: () => void
  /** 重置数据 */
  reset: () => void
  /** 错误信息 */
  error: Error | null
}

/**
 * 无限滚动 Hook
 */
export function useInfiniteScroll<T>({
  fetchData,
  initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [data, setData] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const pageRef = useRef(initialPage)
  const isFetchingRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMore) return

    isFetchingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchData(pageRef.current)

      setData((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
      pageRef.current += 1
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch data"))
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [fetchData, hasMore])

  const reset = useCallback(() => {
    setData([])
    setHasMore(true)
    setError(null)
    pageRef.current = initialPage
    isFetchingRef.current = false
  }, [initialPage])

  return {
    data,
    isLoading,
    hasMore,
    loadMore,
    reset,
    error,
  }
}

// ============================================
// Hook: 使用虚拟列表
// ============================================

interface UseVirtualListOptions {
  /** 项目总数 */
  totalItems: number
  /** 项目高度 */
  itemHeight: number
  /** 容器高度 */
  containerHeight: number
  /** 缓冲区大小 */
  overscan?: number
}

interface UseVirtualListResult {
  /** 可见范围起始索引 */
  startIndex: number
  /** 可见范围结束索引 */
  endIndex: number
  /** 总高度 */
  totalHeight: number
  /** 偏移量 */
  offsetY: number
  /** 滚动处理器 */
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void
}

/**
 * 虚拟列表 Hook
 */
export function useVirtualList({
  totalItems,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualListOptions): UseVirtualListResult {
  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const endIndex = Math.min(totalItems, startIndex + visibleCount + overscan * 2)

  const totalHeight = totalItems * itemHeight
  const offsetY = startIndex * itemHeight

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    onScroll,
  }
}

export default InfiniteScroll
