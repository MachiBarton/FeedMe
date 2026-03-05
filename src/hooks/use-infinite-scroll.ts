import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

export interface InfiniteScrollOptions<T> {
  /** 初始加载数量 */
  initialCount?: number;
  /** 每次追加数量 */
  loadMoreCount?: number;
  /** 最大保留数量 */
  maxItems?: number;
  /** 触发加载的阈值（像素） */
  threshold?: number;
  /** 数据源 */
  items: T[];
  /** 是否启用 */
  enabled?: boolean;
}

export interface InfiniteScrollState<T> {
  /** 当前显示的项目 */
  visibleItems: T[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 是否还有更多 */
  hasMore: boolean;
  /** 当前显示数量 */
  visibleCount: number;
  /** 加载更多 */
  loadMore: () => void;
  /** 重置 */
  reset: () => void;
  /** 滚动容器 ref */
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * 无限滚动 Hook
 *
 * @example
 * ```tsx
 * const { visibleItems, isLoading, hasMore, loadMore, containerRef } = useInfiniteScroll({
 *   items: articles,
 *   initialCount: 10,
 *   loadMoreCount: 10,
 *   maxItems: 100,
 * });
 *
 * return (
 *   <div ref={containerRef as any} className="overflow-auto h-[600px]">
 *     {visibleItems.map(item => <ArticleCard key={item.id} item={item} />)}
 *     {isLoading && <LoadingSpinner />}
 *   </div>
 * );
 * ```
 */
export function useInfiniteScroll<T>({
  items,
  initialCount = 10,
  loadMoreCount = 10,
  maxItems = 100,
  threshold = 200,
  enabled = true,
}: InfiniteScrollOptions<T>): InfiniteScrollState<T> {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const loadingRef = useRef(false);

  // 计算当前显示的项目
  const visibleItems = useMemo(() => {
    return items.slice(0, Math.min(visibleCount, maxItems));
  }, [items, visibleCount, maxItems]);

  // 是否还有更多
  const hasMore = useMemo(() => {
    return visibleCount < items.length && visibleCount < maxItems;
  }, [visibleCount, items.length, maxItems]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    // 模拟异步加载（实际项目中这里可能是 API 调用）
    setTimeout(() => {
      setVisibleCount(prev => {
        const newCount = prev + loadMoreCount;
        return Math.min(newCount, items.length, maxItems);
      });
      setIsLoading(false);
      loadingRef.current = false;
    }, 300);
  }, [hasMore, loadMoreCount, items.length, maxItems]);

  // 重置
  const reset = useCallback(() => {
    setVisibleCount(initialCount);
    setIsLoading(false);
    loadingRef.current = false;
  }, [initialCount]);

  // 监听滚动
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (loadingRef.current || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;

      if (distanceToBottom < threshold) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enabled, hasMore, threshold, loadMore]);

  // 当 items 变化时重置
  useEffect(() => {
    reset();
  }, [items.length, reset]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    visibleCount,
    loadMore,
    reset,
    containerRef,
  };
}

/**
 * 使用 Intersection Observer 的无限滚动 Hook
 * 更现代的方式，性能更好
 */
export function useIntersectionInfiniteScroll<T>({
  items,
  initialCount = 10,
  loadMoreCount = 10,
  maxItems = 100,
  enabled = true,
}: InfiniteScrollOptions<T>): InfiniteScrollState<T> & {
  sentinelRef: React.RefObject<HTMLDivElement | null>;
} {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // 计算当前显示的项目
  const visibleItems = useMemo(() => {
    return items.slice(0, Math.min(visibleCount, maxItems));
  }, [items, visibleCount, maxItems]);

  // 是否还有更多
  const hasMore = useMemo(() => {
    return visibleCount < items.length && visibleCount < maxItems;
  }, [visibleCount, items.length, maxItems]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    setTimeout(() => {
      setVisibleCount(prev => {
        const newCount = prev + loadMoreCount;
        return Math.min(newCount, items.length, maxItems);
      });
      setIsLoading(false);
      loadingRef.current = false;
    }, 300);
  }, [hasMore, loadMoreCount, items.length, maxItems]);

  // 重置
  const reset = useCallback(() => {
    setVisibleCount(initialCount);
    setIsLoading(false);
    loadingRef.current = false;
  }, [initialCount]);

  // 使用 Intersection Observer
  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      {
        root: containerRef.current,
        rootMargin: '0px 0px 200px 0px', // 提前 200px 触发
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [enabled, hasMore, loadMore]);

  // 当 items 变化时重置
  useEffect(() => {
    reset();
  }, [items.length, reset]);

  return {
    visibleItems,
    isLoading,
    hasMore,
    visibleCount,
    loadMore,
    reset,
    containerRef,
    sentinelRef,
  };
}

/**
 * 虚拟列表 Hook（用于大量数据）
 * 只渲染可见区域的项目
 */
export interface VirtualListOptions<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export interface VirtualListState<T> {
  virtualItems: Array<{ item: T; index: number; style: React.CSSProperties }>;
  totalHeight: number;
  scrollTop: number;
  onScroll: (e: React.UIEvent<HTMLElement>) => void;
}

export function useVirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: VirtualListOptions<T>): VirtualListState<T> {
  const [scrollTop, setScrollTop] = useState(0);

  // 计算可见范围
  const { virtualItems, totalHeight } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + overscan * 2;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    const virtualItems = [];
    for (let i = startIndex; i < endIndex; i++) {
      virtualItems.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute' as const,
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0,
        },
      });
    }

    return { virtualItems, totalHeight };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollTop,
    onScroll,
  };
}

export default useInfiniteScroll;
