import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { loadFeedData } from '@/lib/data-store';
import { findSourceByUrl } from '@/config/rss-config';
import { getSourceDisplayConfig } from '@/config/rss-display-config';
import type { FeedItem } from '@/lib/types';

/**
 * 从文章ID解码源URL和链接
 */
function decodeArticleId(articleId: string): { sourceUrl: string; link: string } | null {
  try {
    const parts = articleId.split(':');
    if (parts.length !== 2) return null;

    // 还原 base64 字符串（将 _ 替换回原来的字符）
    // generateArticleId 使用: btoa(...).replace(/[/+=]/g, '_')
    // 所以这里需要将 _ 替换回 /、+、=
    const sourceUrlBase64 = parts[0].replace(/_/g, '/');
    const linkBase64 = parts[1].replace(/_/g, '/');

    // 解码
    const sourceUrl = atob(sourceUrlBase64);
    const link = atob(linkBase64);

    return { sourceUrl, link };
  } catch (error) {
    console.error('Failed to decode article ID:', error);
    return null;
  }
}

/**
 * 文章详情页
 * 在应用内部展示原文内容
 */
export function ArticlePage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/article/:id');
  const [article, setArticle] = useState<FeedItem | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadArticle() {
      if (!match || !params?.id) {
        setLoading(false);
        return;
      }

      // 解码 URL 中的 ID
      const decodedId = decodeURIComponent(params.id);
      const decoded = decodeArticleId(decodedId);

      if (!decoded) {
        setLoading(false);
        return;
      }

      setSourceUrl(decoded.sourceUrl);

      // 加载 feed 数据
      const feedData = await loadFeedData(decoded.sourceUrl);
      if (feedData) {
        // 查找匹配的文章
        const foundArticle = feedData.items.find(item => item.link === decoded.link);
        if (foundArticle) {
          setArticle(foundArticle);
        }
      }

      setLoading(false);
    }

    loadArticle();
  }, [match, params?.id]);

  // 返回上一页
  const handleBack = () => {
    setLocation('/');
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

  // 获取来源名称
  const sourceName = sourceUrl
    ? findSourceByUrl(sourceUrl)?.name
    : undefined;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded-md w-1/4 animate-pulse" />
        <div className="h-4 bg-muted rounded-md w-1/2 animate-pulse" />
        <div className="space-y-4 mt-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded-md w-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-muted-foreground mb-6">该文章可能已被删除或无法访问</p>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 全局样式 - 强制缩放外部内容 */}
      <style>{`
        .article-content * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .article-content img {
          max-width: 100% !important;
          height: auto !important;
        }
        .article-content table {
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important;
        }
        .article-content td, .article-content th {
          word-break: break-word !important;
          overflow-wrap: break-word !important;
        }
      `}</style>

      {/* 返回按钮 */}
      <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        返回
      </Button>

      {/* 文章头部信息 */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl leading-tight">{article.title}</CardTitle>
          <CardDescription className="flex items-center gap-2 mt-3 flex-wrap">
            {sourceName && (
              <>
                <Badge variant="outline" className="text-xs">
                  {sourceName}
                </Badge>
                <span className="text-muted-foreground">·</span>
              </>
            )}
            <span>{formatDate(article.pubDate || article.isoDate)}</span>
            {article.creator && (
              <>
                <span className="text-muted-foreground">·</span>
                <span>{article.creator}</span>
              </>
            )}
          </CardDescription>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2 mt-4">
            {article.link && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                在外部浏览器打开
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* AI 摘要 */}
      {article.summary && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI 摘要</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm whitespace-pre-line leading-relaxed">
              {article.summary}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 原文内容 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">原文内容</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const displayConfig = sourceName ? getSourceDisplayConfig(sourceName) : undefined;
            const useIframe = displayConfig?.contentMode === 'iframe' && article.link;

            if (useIframe) {
              const iframeOptions = displayConfig?.iframeOptions || {};
              return (
                <iframe
                  src={article.link}
                  className="w-full border-0 rounded-md"
                  style={{
                    height: iframeOptions.height || '80vh',
                    minHeight: '600px',
                  }}
                  title={article.title}
                  sandbox={iframeOptions.sandbox || 'allow-scripts allow-same-origin allow-popups'}
                />
              );
            }

            return (
              <div
                className="article-content"
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  maxWidth: '100%',
                }}
                dangerouslySetInnerHTML={{
                  __html: article.content || article.contentSnippet || '<p class="text-muted-foreground">无内容</p>',
                }}
              />
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}

export default ArticlePage;
