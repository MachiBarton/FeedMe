"use client";

import { ArticleCard, ArticleCardSkeleton } from "@/components/article-card";
import type { FeedItem } from "@/lib/types";

export interface CardArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListCardProps {
  items: CardArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListCard({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListCardProps) {
  return (
    <div className="space-y-6">
      {items.map((item, index) => {
        const articleId = generateArticleId(item.sourceUrl, item.link || "");
        const sourceName = getSourceName?.(item.sourceUrl) || item.sourceTitle;

        return (
          <ArticleCard
            key={articleId}
            item={item}
            articleId={articleId}
            index={index}
            sourceName={sourceName}
          />
        );
      })}
    </div>
  );
}

export default ArticleListCard;
