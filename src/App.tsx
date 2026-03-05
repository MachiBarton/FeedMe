import { Suspense } from 'react';
import { Router, Route, Switch } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar, SidebarLayout } from '@/components/sidebar';
import { ScrollToTop } from '@/components/scroll-to-top';
import { Toaster } from '@/components/ui/toaster';

// 页面组件
import { HomePage } from '@/pages/home';
import { SettingsPage } from '@/pages/settings';
import { ArticlePage } from '@/pages/article';
import { SourcesPage } from '@/pages/sources';
import { AboutPage } from '@/pages/about';

/**
 * 应用主组件
 * 集成路由、主题、侧边栏布局
 */
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <Router>
        <AppContent />
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

/**
 * 应用内容组件
 * 包含侧边栏布局和路由切换
 */
function AppContent() {
  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <main className="container py-6 md:py-10 mx-auto max-w-6xl px-4">
          <Suspense fallback={<PageSkeleton />}>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/sources" component={SourcesPage} />
              <Route path="/article/:id" component={ArticlePage} />
              <Route path="/about" component={AboutPage} />
              {/* 404 页面 */}
              <Route>
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                  <h1 className="text-4xl font-bold mb-4">404</h1>
                  <p className="text-muted-foreground mb-6">页面未找到</p>
                  <a href="/" className="text-primary hover:underline">返回首页</a>
                </div>
              </Route>
            </Switch>
          </Suspense>
        </main>

        <footer className="border-t border-border mt-auto">
          <div className="container mx-auto max-w-6xl py-6 px-4">
            <p className="text-center text-sm text-muted-foreground">
              Powered by <a href="https://github.com/Seanium/FeedMe" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">FeedMe</a>
            </p>
          </div>
        </footer>
        <ScrollToTop />
      </div>
    </SidebarLayout>
  );
}

/**
 * 页面加载骨架屏
 */
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/3" />
      <div className="h-10 bg-muted rounded-md w-full md:w-[300px]" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="h-7 bg-muted rounded-md w-3/4" />
          <div className="h-4 bg-muted rounded-md w-1/2" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded-md w-full" />
            <div className="h-4 bg-muted rounded-md w-full" />
            <div className="h-4 bg-muted rounded-md w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
