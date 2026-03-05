import { Route, Switch } from 'wouter';
import { HomePage } from '@/pages/home';
import { SettingsPage } from '@/pages/settings';
import { ArticlePage } from '@/pages/article';
import { SourcesPage } from '@/pages/sources';
import { AboutPage } from '@/pages/about';

/**
 * 应用路由配置
 * 使用 wouter 的 HashRouter 模式以兼容静态站点部署
 *
 * 注意：实际路由注册在 App.tsx 中，此文件仅导出路由配置供其他组件使用
 */
export function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/sources" component={SourcesPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/article/:id" component={ArticlePage} />
      {/* 404 页面 */}
      <Route>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-muted-foreground">页面未找到</p>
        </div>
      </Route>
    </Switch>
  );
}

/**
 * 路由路径定义
 * 用于导航和链接
 */
export const routes = {
  home: '/',
  settings: '/settings',
  sources: '/sources',
  about: '/about',
} as const;

/**
 * 导航项配置
 * 用于侧边栏和底部导航
 */
export interface NavItem {
  path: string;
  label: string;
  icon: string; // Lucide icon name
  badge?: number;
}

export const navItems: NavItem[] = [
  { path: routes.home, label: '全部文章', icon: 'Home' },
  { path: routes.sources, label: '订阅源', icon: 'Rss' },
  { path: routes.settings, label: '设置', icon: 'Settings' },
  { path: routes.about, label: '关于', icon: 'Info' },
];
