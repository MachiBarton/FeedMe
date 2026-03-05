import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ExternalLink,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FeedItem } from '@/lib/types';
import { LazyImage, getImageUrl, hasImage } from '@/components/lazy-image';

export interface ArticleCardProps {
  /** 文章数据 */
  item: FeedItem;
  /** 文章唯一ID */
  articleId: string;
  /** 序号 */
  index: number;
  /** 来源名称 */
  sourceName?: string;
  /** 额外的CSS类 */
  className?: string;
  /** 是否嵌入原始内容（针对juya-ai-daily等特殊源） */
  embedContent?: boolean;
}

/**
 * 清理HTML标签，保留纯文本
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * 格式化嵌入内容：清理HTML并格式化
 */
function formatEmbeddedContent(content: string): string {
  // 先清理HTML标签
  let text = stripHtml(content);
  // 规范化空白字符
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

/**
 * 嵌入内容卡片组件
 * 用于juya-ai-daily等特殊源，直接展示原始内容
 */
export function EmbeddedArticleCard({
  item,
  articleId,
  index,
  sourceName,
  className,
}: ArticleCardProps) {
  // 格式化日期
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '未知日期';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取格式化后的内容
  const embeddedContent = item.content
    ? formatEmbeddedContent(item.content)
    : item.contentSnippet
      ? formatEmbeddedContent(item.contentSnippet)
      : item.summary || '暂无内容';

  return (
    <Card
      className={cn(
        'feed-card relative group transition-all duration-200',
        'hover:shadow-md',
        className
      )}
    >
      {/* 序号徽章 */}
      <div
        className={cn(
          'absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full font-bold shadow-md text-sm',
          'bg-primary text-primary-foreground'
        )}
      >
        {index + 1}
      </div>

      <CardHeader className={'pb-3 pl-4'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl leading-tight">
              <span>{item.title}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
              {sourceName && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {sourceName}
                  </Badge>
                  <span className="text-muted-foreground">·</span>
                </>
              )}
              <span>{formatDate(item.pubDate || item.isoDate)}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className={'pt-0 pl-4'}>
        <div className="space-y-4">
          {/* 嵌入的原始内容区域 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                原文内容：
              </div>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  访问原文链接
                </a>
              )}
            </div>
            <div className="text-foreground whitespace-pre-line leading-relaxed bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {embeddedContent}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useLocation } from 'wouter';
import { CardDescription } from '@/components/ui/card';

export function ArticleCard({
  item,
  articleId,
  index,
  sourceName,
  className,
  embedContent = false,
}: ArticleCardProps) {
  // 如果需要嵌入内容，使用EmbeddedArticleCard
  if (embedContent) {
    return (
      <EmbeddedArticleCard
        item={item}
        articleId={articleId}
        index={index}
        sourceName={sourceName}
        className={className}
      />
    );
  }

  const [, setLocation] = useLocation();

  // 处理打开文章详情页
  const handleOpenArticle = () => {
    // 导航到内部文章详情页
    setLocation(`/article/${encodeURIComponent(articleId)}`);
  };

  // 格式化日期
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '未知日期';
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 获取文章图片URL
  const imageUrl = getImageUrl(item);
  const hasArticleImage = hasImage(item);

  return (
    <Card
      className={cn(
        'feed-card relative group transition-all duration-200',
        'hover:shadow-md',
        className
      )}
    >
      {/* 序号徽章 */}
      <div
        className={cn(
          'absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full font-bold shadow-md text-sm',
          'bg-primary text-primary-foreground'
        )}
      >
        {index + 1}
      </div>

      <CardHeader className={'pb-3 pl-4'}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl leading-tight">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'hover:underline flex items-center gap-2 group/link'
                )}
              >
                <span className="truncate">{item.title}</span>
                <ExternalLink className="h-4 w-4 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-sm text-muted-foreground">
              {sourceName && (
                <>
                  <Badge variant="outline" className="text-xs">
                    {sourceName}
                  </Badge>
                  <span>·</span>
                </>
              )}
              <span>{formatDate(item.pubDate || item.isoDate)}</span>
              {item.creator && (
                <>
                  <span>·</span>
                  <span>{item.creator}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* 文章封面图 - 使用懒加载 */}
      {hasArticleImage && imageUrl && (
        <div className={'px-6 pb-4 pl-10'}>
          <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden bg-muted">
            <LazyImage
              src={imageUrl}
              alt={item.title || '文章图片'}
              containerClassName="w-full h-full"
              className="hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      )}

      <CardContent className={'pt-0 pl-4'}>
        <div className="space-y-4">
          {/* AI 摘要区域 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                由 AI 生成的摘要：
              </div>
              {item.link && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={handleOpenArticle}
                >
                  <FileText className="h-4 w-4" />
                  查看原文
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="text-foreground whitespace-pre-line leading-relaxed">
              {item.summary || '无法生成摘要。'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 文章卡片骨架屏
 */
export function ArticleCardSkeleton({ index, showImage = false }: { index: number; showImage?: boolean }) {
  return (
    <Card className="feed-card relative">
      <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-bold shadow-md text-sm">
        {index + 1}
      </div>
      <CardHeader>
        <div className="h-6 bg-muted rounded-md w-3/4 animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse mt-2" />
      </CardHeader>
      {showImage && (
        <div className="px-6 pb-4">
          <div className="w-full h-48 md:h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      )}
      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-full animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-4/5 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 文章卡片空状态
 */
export function ArticleCardEmpty() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <ExternalLink className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">暂无文章</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          该订阅源暂时没有文章，请稍后再试
        </p>
      </CardContent>
    </Card>
  );
}

export default ArticleCard;
