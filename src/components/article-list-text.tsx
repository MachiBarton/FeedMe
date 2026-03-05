"use client";

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { FeedItem } from "@/lib/types";

export interface TextArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListTextProps {
  items: TextArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListText({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListTextProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "未知日期";
    return new Date(dateStr).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const handleItemClick = (item: TextArticleItem) => {
    const articleId = generateArticleId(item.sourceUrl, item.link || "");
    navigate(`/article/${encodeURIComponent(articleId)}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {items.map((item, index) => {
        const articleId = generateArticleId(item.sourceUrl, item.link || "");
        const sourceName = getSourceName?.(item.sourceUrl) || item.sourceTitle;

        return (
          <article
            key={articleId}
            onClick={() => handleItemClick(item)}
            className={cn(
              "group py-6 cursor-pointer",
              "border-b border-border/30 last:border-0",
              "hover:opacity-80 transition-opacity"
            )}
          >
            {/* 元信息行 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              {sourceName && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                  {sourceName}
                </Badge>
              )}
              <span>{formatDate(item.pubDate || item.isoDate)}</span>
            </div>

            {/* 标题 */}
            <h3
              className={cn(
                "text-lg font-medium leading-snug"
              )}
            >
              {item.title}
            </h3>

            {/* 摘要（如果有） */}
            {item.summary && (
              <p className="mt-2 text-sm text-muted-foreground/80 line-clamp-2">
                {item.summary.length > 150
                  ? item.summary.slice(0, 150) + "..."
                  : item.summary}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

export default ArticleListText;
