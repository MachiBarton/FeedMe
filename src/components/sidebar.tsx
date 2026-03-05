import { useState, useEffect } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Home,
  Settings,
  Rss,
  Info,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
};

export type SidebarProps = {
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
  className?: string;
};

// 导航项配置 - 与路由路径对应
const navItems: NavItem[] = [
  { id: 'home', label: '全部文章', icon: <Home className="h-5 w-5" />, href: '/' },
  { id: 'sources', label: '订阅源', icon: <Rss className="h-5 w-5" />, href: '/sources' },
  { id: 'settings', label: '设置', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  { id: 'about', label: '关于', icon: <Info className="h-5 w-5" />, href: '/about' },
];

/**
 * 根据当前路径获取激活的导航项 ID
 */
function getActiveItemFromPath(path: string): string {
  const item = navItems.find(item => item.href === path);
  return item?.id || 'home';
}

/**
 * 侧边栏导航组件
 * 桌面端：左侧固定侧边栏
 * 移动端：底部导航栏
 */
export function Sidebar({
  activeItem: propActiveItem,
  onNavigate,
  className,
}: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [_, params] = useRoute('/article/:id');

  // 从当前路径计算激活项
  const activeItem = propActiveItem || getActiveItemFromPath(location);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 从 localStorage 读取折叠状态
  useEffect(() => {
    const stored = localStorage.getItem('feedme:sidebar-collapsed');
    if (stored) {
      setIsCollapsed(stored === 'true');
    }
  }, []);

  // 保存折叠状态
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('feedme:sidebar-collapsed', String(newState));
  };

  const handleNavigate = (itemId: string) => {
    const item = navItems.find(i => i.id === itemId);
    if (item) {
      setLocation(item.href);
    }
    onNavigate?.(itemId);
    setMobileMenuOpen(false);
  };

  // 移动端底部导航
  if (isMobile) {
    return (
      <>
        {/* 底部导航栏 */}
        <nav className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background/95 backdrop-blur-sm border-t',
          'safe-area-inset-bottom',
          className
        )}>
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.slice(0, 4).map((item) => {
              const isActive = activeItem === item.id;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigate(item.id);
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center',
                    'px-3 py-1 rounded-lg transition-colors',
                    'min-w-[64px]',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className="relative">
                    {item.icon}
                  </div>
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              );
            })}

            {/* 更多菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center',
                'px-3 py-1 rounded-lg transition-colors',
                'min-w-[64px]',
                mobileMenuOpen
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Menu className="h-5 w-5" />
              <span className="text-xs mt-1">更多</span>
            </button>
          </div>
        </nav>

        {/* 移动端菜单抽屉 */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={cn(
              'fixed bottom-[72px] left-4 right-4 z-50',
              'bg-background rounded-xl shadow-lg border',
              'p-4 animate-in slide-in-from-bottom-4'
            )}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">菜单</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {navItems.map((item) => {
                  const isActive = activeItem === item.id;

                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavigate(item.id);
                      }}
                      className={cn(
                        'flex items-center justify-between w-full',
                        'px-4 py-3 rounded-lg transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // 桌面端侧边栏
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen',
        'bg-background border-r',
        'flex flex-col',
        'transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[72px]' : 'w-[240px]',
        className
      )}
    >
      {/* Logo 区域 */}
      <div className="flex items-center justify-between h-16 px-4 border-b">
        {!isCollapsed && (
          <a href="/" className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors truncate">
            <img src="/Feed-icon.ico" alt="RSS" className="h-6 w-6" />
            <span>RSS</span>
          </a>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className={cn('shrink-0', isCollapsed && 'mx-auto')}
          title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 导航项 */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;

          return (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavigate(item.id);
              }}
              className={cn(
                'flex items-center w-full',
                'px-3 py-2.5 rounded-lg transition-colors',
                'group relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center'
              )}
              title={isCollapsed ? item.label : undefined}
            >
                <div className="relative shrink-0">
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <>
                    <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                  </>
                )}

                {/* 折叠状态下的 Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border shadow-sm">
                    {item.label}
                  </div>
                )}
              </a>
          );
        })}
      </nav>

      {/* 底部信息 */}
      {!isCollapsed && (
        <div className="p-4 border-t text-xs text-muted-foreground">
          <p>Powered by <a href="https://github.com/Seanium/FeedMe" target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">FeedMe</a></p>
        </div>
      )}
    </aside>
  );
}

/**
 * 侧边栏布局包装组件
 */
export type SidebarLayoutProps = {
  children: React.ReactNode;
  sidebarProps?: Omit<SidebarProps, 'className'>;
};

export function SidebarLayout({ children, sidebarProps }: SidebarLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar {...sidebarProps} />
      <main
        className={cn(
          'transition-all duration-300',
          isMobile
            ? 'pb-20' // 为底部导航栏留出空间
            : 'ml-[72px] lg:ml-[240px]' // 为侧边栏留出空间
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default Sidebar;
