import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArticleCard, ArticleCardSkeleton, ArticleCardEmpty } from '@/components/article-card';
import { ArticleFilter, SortType, sortArticles } from '@/components/article-filter';
import { useIntersectionInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { generateArticleId } from '@/hooks/use-articles';
import type { FeedItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export interface InfiniteArticleListProps {
  /** 文章列表 */
  items: FeedItem[];
  /** 来源ID */
  sourceId: string;
  /** 来源URL */
  sourceUrl: string;
  /** 来源名称 */
  sourceName?: string;
  /** 是否加载中 */
  isLoading?: boolean;
  /** 是否为空 */
  isEmpty?: boolean;
  /** 额外的CSS类 */
  className?: string;
  /** 使用虚拟列表（大量数据时） */
  useVirtualList?: boolean;
  /** 初始加载数量 */
  initialCount?: number;
  /** 每次追加数量 */
  loadMoreCount?: number;
  /** 最大保留数量 */
  maxItems?: number;
  /** 是否嵌入原始内容（针对juya-ai-daily等特殊源） */
  embedContent?: boolean;
}

/**
 * 无限滚动文章列表组件
 * 集成排序、无限滚动功能
 */
export function InfiniteArticleList({
  items,
  sourceId,
  sourceUrl,
  sourceName,
  isLoading: externalLoading = false,
  isEmpty = false,
  className,
  useVirtualList = false,
  initialCount = 10,
  loadMoreCount = 10,
  maxItems = 100,
  embedContent = false,
}: InfiniteArticleListProps) {
  const [sort, setSort] = useState<SortType>('date-desc');

  // 为文章添加ID
  const articlesWithId = useMemo(() => {
    return items.map((item) => {
      const articleId = generateArticleId(sourceUrl, item.link || '');
      return {
        ...item,
        id: articleId,
        sourceId,
        sourceUrl,
      };
    });
  }, [items, sourceUrl, sourceId]);

  // 排序
  const sortedArticles = useMemo(() => {
    return sortArticles(articlesWithId, sort);
  }, [articlesWithId, sort]);

  // 无限滚动
  const {
    visibleItems,
    isLoading: isLoadingMore,
    hasMore,
    loadMore,
    containerRef,
    sentinelRef,
  } = useIntersectionInfiniteScroll({
    items: sortedArticles,
    initialCount,
    loadMoreCount,
    maxItems,
    enabled: !useVirtualList,
  });

  // 加载更多按钮
  const handleLoadMore = () => {
    loadMore();
  };

  // 外部加载状态
  if (externalLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        {Array.from({ length: initialCount }).map((_, i) => (
          <ArticleCardSkeleton key={i} index={i} />
        ))}
      </div>
    );
  }

  // 空状态
  if (isEmpty || items.length === 0) {
    return <ArticleCardEmpty />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 排序器 */}
      <ArticleFilter
        currentSort={sort}
        onSortChange={setSort}
      />

      {/* 文章列表 */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="space-y-6 overflow-visible"
      >
        {visibleItems.map((item, index) => (
          <ArticleCard
            key={item.id}
            item={item}
            articleId={item.id}
            index={index}
            sourceName={sourceName}
            embedContent={embedContent}
          />
        ))}

        {/* 加载更多指示器 */}
        {hasMore && (
          <>
            {/* Intersection Observer 触发器 */}
            <div ref={sentinelRef} className="h-4" />

            {/* 加载状态 */}
            {isLoadingMore && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">加载更多...</span>
              </div>
            )}

            {/* 手动加载按钮（备用） */}
            {!isLoadingMore && (
              <div className="flex justify-center py-4">
                <Button variant="outline" onClick={handleLoadMore}>
                  加载更多
                </Button>
              </div>
            )}
          </>
        )}

        {/* 已加载全部 */}
        {!hasMore && visibleItems.length > initialCount && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            已加载全部 {visibleItems.length} 篇文章
          </div>
        )}

        {/* 达到最大限制提示 */}
        {visibleItems.length >= maxItems && (
          <div className="text-center py-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
            已达到最大显示限制（{maxItems} 篇），请调整排序
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 简单的无限滚动容器
 * 用于包装任意内容
 */
export interface InfiniteScrollContainerProps {
  children: React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  className?: string;
}

export function InfiniteScrollContainer({
  children,
  hasMore,
  isLoading,
  onLoadMore,
  className,
}: InfiniteScrollContainerProps) {
  const { containerRef, sentinelRef } = useIntersectionInfiniteScroll<unknown>({
    items: hasMore ? [1] : [], // 使用占位数据触发加载
    enabled: hasMore,
  });

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={className}>
      {children}

      {hasMore && (
        <>
          <div ref={sentinelRef} className="h-4" />
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InfiniteArticleList;
