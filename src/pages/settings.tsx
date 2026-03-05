import { Settings, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * 主题切换按钮
 */
function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-sm text-muted-foreground">加载中...</div>;
  }

  const themes = [
    { id: 'light', label: '亮色', icon: Sun },
    { id: 'dark', label: '暗色', icon: Moon },
    { id: 'system', label: '系统', icon: Monitor },
  ] as const;

  return (
    <div className="flex items-center gap-2">
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.id;
        return (
          <Button
            key={t.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTheme(t.id)}
            className="gap-1.5"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{t.label}</span>
            {isActive && <span className="sr-only">（当前）</span>}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * 设置页面
 * 应用设置和数据管理
 */
export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">设置</h1>
      </div>

      <div className="space-y-6">
        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">外观</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">主题</p>
                <p className="text-sm text-muted-foreground">选择亮色或暗色主题</p>
              </div>
              <ThemeSelector />
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">数据管理</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">导出 OPML</p>
                <p className="text-sm text-muted-foreground">备份你的订阅列表</p>
              </div>
              <button className="px-4 py-2 text-sm border rounded-md hover:bg-muted">
                导出
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
