"use client";

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LazyImage, getImageUrl } from "@/components/lazy-image";
import type { FeedItem } from "@/lib/types";

export interface GridArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListGridProps {
  items: GridArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListGrid({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListGridProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "未知日期";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const handleItemClick = (item: GridArticleItem) => {
    const articleId = generateArticleId(item.sourceUrl, item.link || "");
    navigate(`/article/${encodeURIComponent(articleId)}`);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item, index) => {
        const articleId = generateArticleId(item.sourceUrl, item.link || "");
        const sourceName = getSourceName?.(item.sourceUrl) || item.sourceTitle;
        const imageUrl = getImageUrl(item);
        const hasImage = !!imageUrl;

        return (
          <div
            key={articleId}
            onClick={() => handleItemClick(item)}
            className={cn(
              "group relative bg-card rounded-lg border overflow-hidden cursor-pointer",
              "hover:shadow-md transition-all duration-200"
            )}
          >
            {/* 图片区域 */}
            <div className="aspect-[4/3] relative bg-muted overflow-hidden flex items-center justify-center">
              {hasImage ? (
                <LazyImage
                  src={imageUrl || ""}
                  alt={item.title}
                  containerClassName="w-full h-full flex items-center justify-center"
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  fallbackType="pattern"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <span className="text-4xl font-bold text-muted-foreground/30">
                    {index + 1}
                  </span>
                </div>
              )}
            </div>

            {/* 内容区域 */}
            <div className="p-3">
              <h3
                className={cn(
                  "font-medium text-sm line-clamp-2 min-h-[2.5rem]"
                )}
              >
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

export default ArticleListGrid;
