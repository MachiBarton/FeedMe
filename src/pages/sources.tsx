import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rss, ExternalLink } from 'lucide-react';
import { config, getSourcesByCategory } from '@/config/rss-config';

/**
 * 订阅源管理页面
 * 展示当前已有的订阅源，按分类显示
 */
export function SourcesPage() {
  const sourcesByCategory = getSourcesByCategory();
  const categories = Object.keys(sourcesByCategory);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">订阅源</h2>
          <p className="text-sm text-muted-foreground mt-1">
            共 {config.sources.length} 个订阅源
          </p>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Rss className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">暂无订阅源</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              您还没有添加任何 RSS 订阅源
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {sourcesByCategory[category].length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {sourcesByCategory[category].map((source) => (
                    <div
                      key={source.url}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{source.name}</div>
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {source.url}
                        </div>
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 p-2 rounded-md hover:bg-background transition-colors"
                        title="查看 RSS 源"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default SourcesPage;
