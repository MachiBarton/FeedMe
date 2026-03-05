import { Info, Github, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 关于页面
 * 介绍项目来源和修改内容
 */
export function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Info className="h-6 w-6" />
        <h1 className="text-2xl font-bold">关于</h1>
      </div>

      <div className="space-y-6">
        {/* 项目来源 */}
        <Card>
          <CardHeader>
            <CardTitle>项目来源</CardTitle>
                      </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              本项目是基于 <a href="https://github.com/Seanium/FeedMe" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">FeedMe <ExternalLink className="h-3 w-3" /></a> 二次开发而来。
            </p>
            <p className="text-sm text-muted-foreground">
              FeedMe 是一个 AI 驱动的 RSS 阅读器，可以聚合多个来源的内容并使用大语言模型自动生成文章摘要。
            </p>
            <a
              href="https://github.com/Seanium/FeedMe"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Github className="h-4 w-4" />
              查看原项目
            </a>
          </CardContent>
        </Card>

        {/* 主要修改 */}
        <Card>
          <CardHeader>
            <CardTitle>主要修改</CardTitle>
                      </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>简化导航：</strong>移除"收藏"和"历史"菜单，只保留"全部文章"、"订阅源"和"设置"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>新增订阅源页面：</strong>展示当前已有的订阅源，按分类显示</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>新增文章详情页：</strong>点击文章后在应用内打开原文，而不是跳转到外部链接</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>主题切换功能：</strong>在设置页面添加亮色/暗色/系统主题切换按钮</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>默认亮色主题：</strong>将默认主题从"系统"改为"亮色"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>移除导入功能：</strong>删除 OPML 导入功能，只保留导出功能</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>移除字体大小设置：</strong>字体大小改为根据屏幕自适应</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>品牌更新：</strong>将"FeedMe"改名为"RSS"，并添加 RSS 图标</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>更新页脚信息：</strong>改为"Powered by FeedMe"并链接到原项目</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AboutPage;
