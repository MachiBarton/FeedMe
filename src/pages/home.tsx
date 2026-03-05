import { Suspense } from 'react';
import { RssFeed } from '@/components/rss-feed';
import { SourceSwitcher } from '@/components/source-switcher';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 首页 - 全部文章
 * 显示文章列表和源选择器
 */
export function HomePage() {
  return (
    <div className="space-y-6">
      {/* 源选择器 */}
      <div className="flex items-center gap-4">
        <Suspense fallback={<Skeleton className="w-full md:w-[300px] h-10" />}>
          <SourceSwitcher />
        </Suspense>
      </div>

      {/* 文章列表 - 默认显示全部源 */}
      <Suspense fallback={<FeedSkeleton />}>
        <RssFeed defaultSource="__all__" />
      </Suspense>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4 feed-card">
          <div className="h-7 bg-muted rounded-md animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded-md animate-pulse w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-full" />
            <div className="h-4 bg-muted rounded-md animate-pulse w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
