"use client";

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FeedItem } from "@/lib/types";

export interface CompactArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListCompactProps {
  items: CompactArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListCompact({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListCompactProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "未知日期";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (item: CompactArticleItem) => {
    const articleId = generateArticleId(item.sourceUrl, item.link || "");
    navigate(`/article/${encodeURIComponent(articleId)}`);
  };

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const articleId = generateArticleId(item.sourceUrl, item.link || "");
        const sourceName =
          getSourceName?.(item.sourceUrl) || item.sourceTitle;

        return (
          <div
            key={articleId}
            onClick={() => handleItemClick(item)}
            className={cn(
              "group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg cursor-pointer",
              "hover:bg-accent/50 transition-colors",
              "border-b border-border/50 last:border-0"
            )}
          >
            {/* 序号 */}
            <span
              className={cn(
                "w-6 text-sm font-medium text-center shrink-0 text-primary"
              )}
            >
              {index + 1}
            </span>

            {/* 内容区 */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      "text-sm font-medium truncate"
                    )}
                  >
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {sourceName && (
                    <>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {sourceName}
                      </Badge>
                      <span>·</span>
                    </>
                  )}
                  <span>{formatDate(item.pubDate || item.isoDate)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ArticleListCompact;
