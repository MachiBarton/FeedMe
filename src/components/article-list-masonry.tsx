"use client";

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LazyImage, getImageUrl } from "@/components/lazy-image";
import type { FeedItem } from "@/lib/types";

export interface MasonryArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListMasonryProps {
  items: MasonryArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListMasonry({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListMasonryProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "未知日期";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const handleItemClick = (item: MasonryArticleItem) => {
    const articleId = generateArticleId(item.sourceUrl, item.link || "");
    navigate(`/article/${encodeURIComponent(articleId)}`);
  };

  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
      {items.map((item, index) => {
        const articleId = generateArticleId(item.sourceUrl, item.link || "");
        const sourceName = getSourceName?.(item.sourceUrl) || item.sourceTitle;
        const coverImage = getImageUrl(item);

        return (
          <div
            key={articleId}
            onClick={() => handleItemClick(item)}
            className={cn(
              "group relative bg-card rounded-lg border overflow-hidden cursor-pointer break-inside-avoid",
              "hover:shadow-md transition-all duration-200"
            )}
          >
            {/* 图片区域 - 瀑布流高度自适应 */}
            {coverImage ? (
              <div className="relative overflow-hidden bg-muted flex items-center justify-center">
                <LazyImage
                  src={coverImage}
                  alt={item.title}
                  containerClassName="w-full flex items-center justify-center"
                  className="max-w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  fallbackType="pattern"
                />
              </div>
            ) : (
              <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <span className="text-4xl font-bold text-muted-foreground/30">
                  {index + 1}
                </span>
              </div>
            )}

            {/* 内容区域 */}
            <div className="p-3">
              <h3 className="font-medium text-sm">
                {item.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {sourceName && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {sourceName}
                  </Badge>
                )}
                <span>{formatDate(item.pubDate || item.isoDate)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ArticleListMasonry;
