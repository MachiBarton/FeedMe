"use client";

import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { LazyImage, getImageUrl } from "@/components/lazy-image";
import type { FeedItem } from "@/lib/types";

export interface MagazineArticleItem extends FeedItem {
  sourceUrl: string;
  sourceTitle: string;
}

export interface ArticleListMagazineProps {
  items: MagazineArticleItem[];
  generateArticleId: (sourceUrl: string, link: string) => string;
  getSourceName?: (sourceUrl: string) => string | undefined;
}

export function ArticleListMagazine({
  items,
  generateArticleId,
  getSourceName,
}: ArticleListMagazineProps) {
  const [, navigate] = useLocation();

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "未知日期";
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleItemClick = (item: MagazineArticleItem) => {
    const articleId = generateArticleId(item.sourceUrl, item.link || "");
    navigate(`/article/${encodeURIComponent(articleId)}`);
  };

  // 获取摘要文本
  const getSummary = (item: MagazineArticleItem): string => {
    if (item.summary) {
      return item.summary.length > 120 ? item.summary.slice(0, 120) + "..." : item.summary;
    }
    if (item.contentSnippet) {
      return item.contentSnippet.length > 120 ? item.contentSnippet.slice(0, 120) + "..." : item.contentSnippet;
    }
    return "";
  };

  if (items.length === 0) return null;

  const featuredItem = items[0];
  const featuredId = generateArticleId(featuredItem.sourceUrl, featuredItem.link || "");
  const featuredSourceName = getSourceName?.(featuredItem.sourceUrl) || featuredItem.sourceTitle;
  const featuredImageUrl = getImageUrl(featuredItem);
  const restItems = items.slice(1);

  return (
    <div className="space-y-6">
      {/* 头条大图 */}
      <div
        onClick={() => handleItemClick(featuredItem)}
        className={cn(
          "group relative rounded-xl overflow-hidden cursor-pointer bg-card border",
          "hover:shadow-lg transition-all duration-300"
        )}
      >
        <div className="relative aspect-[21/9] overflow-hidden bg-muted flex items-center justify-center">
          {featuredImageUrl ? (
            <LazyImage
              src={featuredImageUrl}
              alt={featuredItem.title}
              containerClassName="w-full h-full flex items-center justify-center"
              className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
              fallbackType="pattern"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-6xl font-bold text-primary/20">1</span>
            </div>
          )}

          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* 内容覆盖层 */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2 mb-3">
              {featuredSourceName && (
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {featuredSourceName}
                </Badge>
              )}
              <span className="text-white/80 text-sm">
                {formatDate(featuredItem.pubDate || featuredItem.isoDate)}
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
              {featuredItem.title}
            </h2>

            <p className="text-white/80 line-clamp-2 max-w-2xl">
              {getSummary(featuredItem)}
            </p>

            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(featuredItem);
                }}
              >
                阅读全文 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 其余文章 - 水平列表 */}
      {restItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            更多文章
          </h3>

          <div className="grid gap-3">
            {restItems.map((item, index) => {
              const articleId = generateArticleId(item.sourceUrl, item.link || "");
              const sourceName = getSourceName?.(item.sourceUrl) || item.sourceTitle;

              return (
                <div
                  key={articleId}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "group flex gap-4 p-3 -mx-2 rounded-lg cursor-pointer",
                    "hover:bg-accent/50 transition-colors",
                    "border-b border-border/50 last:border-0"
                  )}
                >
                  {/* 序号 */}
                  <span className={cn(
                    "text-lg font-bold w-8 shrink-0 text-primary"
                  )}>
                    {index + 2}
                  </span>

                  {/* 缩略图 */}
                  {(() => {
                    const thumbUrl = getImageUrl(item);
                    return thumbUrl ? (
                      <div className="w-24 h-16 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        <LazyImage
                          src={thumbUrl}
                          alt={item.title}
                          containerClassName="w-full h-full flex items-center justify-center"
                          className="max-w-full max-h-full object-contain"
                          fallbackType="pattern"
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium line-clamp-2">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {sourceName && (
                        <>
                          <Badge variant="outline" className="text-[10px]">
                            {sourceName}
                          </Badge>
                          <span>·</span>
                        </>
                      )}
                      <span>{formatDate(item.pubDate || item.isoDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleListMagazine;
