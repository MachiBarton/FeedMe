import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from '@/hooks/use-navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Search,
  Clock,
  X,
  Filter,
  Calendar,
  Rss,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 搜索历史存储键
const SEARCH_HISTORY_KEY = 'feedme:search-history';
const MAX_HISTORY_ITEMS = 10;

// 过滤器类型
export interface SearchFilters {
  source?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

// 搜索结果类型（与本地搜索模块对接）
export interface SearchResult {
  id: string;
  title: string;
  link: string;
  sourceId: string;
  sourceName: string;
  pubDate: string;
  contentSnippet: string;
  matchType: 'title' | 'content' | 'author';
  relevanceScore: number;
}

export interface SearchBarProps {
  /** 可用来源列表 */
  sources?: { id: string; name: string }[];
  /** 搜索回调 */
  onSearch?: (query: string, filters: SearchFilters) => void;
  /** 结果选择回调 */
  onSelectResult?: (result: SearchResult) => void;
  /** 额外的CSS类 */
  className?: string;
  /** 占位符文本 */
  placeholder?: string;
}

/**
 * 搜索栏组件
 * 支持 ⌘K 快捷键、搜索历史、过滤器
 */
export function SearchBar({
  sources = [],
  onSearch,
  onSelectResult,
  className,
  placeholder = '搜索文章...',
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载搜索历史
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((history: string[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // 添加搜索历史
  const addToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setSearchHistory(prev => {
      const newHistory = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, MAX_HISTORY_ITEMS);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  // 清除搜索历史
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }, []);

  // 删除单个历史记录
  const removeHistoryItem = useCallback((item: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(h => h !== item);
      saveSearchHistory(newHistory);
      return newHistory;
    });
  }, [saveSearchHistory]);

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    addToHistory(searchQuery);

    // TODO: 集成本地搜索模块
    // const searchResults = await searchArticles(searchQuery, filters);
    // setResults(searchResults);

    // 模拟搜索结果（等待本地搜索模块完成）
    setTimeout(() => {
      setResults([]);
      setIsSearching(false);
    }, 300);

    onSearch?.(searchQuery, filters);
  }, [filters, addToHistory, onSearch]);

  // 处理搜索输入
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    performSearch(value);
  }, [performSearch]);

  // 选择搜索结果
  const handleSelectResult = useCallback((result: SearchResult) => {
    setIsOpen(false);
    onSelectResult?.(result);
  }, [onSelectResult]);

  // 选择历史记录
  const handleSelectHistory = useCallback((historyItem: string) => {
    setQuery(historyItem);
    performSearch(historyItem);
  }, [performSearch]);

  // ⌘K 快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 高亮匹配文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-900 px-0.5 rounded">{part}</mark> : part
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20 h-10"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* 过滤器按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7', showFilters && 'bg-accent')}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {/* 快捷键提示 */}
          <kbd className="hidden md:inline-flex h-7 items-center gap-1 rounded border bg-muted px-2 text-xs font-medium">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-popover border rounded-lg shadow-lg z-50">
          <div className="space-y-4">
            {/* 按来源过滤 */}
            {sources.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">来源</label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filters.source === undefined ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(f => ({ ...f, source: undefined }))}
                  >
                    全部
                  </Button>
                  {sources.map(source => (
                    <Button
                      key={source.id}
                      variant={filters.source === source.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilters(f => ({ ...f, source: source.id }))}
                    >
                      {source.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* 按时间过滤 */}
            <div>
              <label className="text-sm font-medium mb-2 block">时间范围</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: '全部时间' },
                  { value: 'today', label: '今天' },
                  { value: 'week', label: '本周' },
                  { value: 'month', label: '本月' },
                ].map(({ value, label }) => (
                  <Button
                    key={value}
                    variant={filters.dateRange === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilters(f => ({ ...f, dateRange: value as SearchFilters['dateRange'] }))}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 搜索下拉面板 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Command 面板 */}
          <Command className="absolute top-full left-0 right-0 mt-2 z-50 bg-popover border rounded-lg shadow-lg overflow-hidden">
            <CommandInput
              placeholder="输入关键词搜索..."
              value={query}
              onValueChange={handleSearch}
              className="border-none focus:ring-0"
            />
            <CommandList className="max-h-[400px]">
              {/* 搜索结果 */}
              {query.trim() && (
                <CommandGroup heading="搜索结果">
                  {isSearching ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      搜索中...
                    </div>
                  ) : results.length === 0 ? (
                    <CommandEmpty>未找到相关文章</CommandEmpty>
                  ) : (
                    results.map(result => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelectResult(result)}
                        className="flex flex-col items-start gap-1 py-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-medium truncate flex-1">
                            {highlightMatch(result.title, query)}
                          </span>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {result.sourceName}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {highlightMatch(result.contentSnippet, query)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(result.pubDate).toLocaleDateString('zh-CN')}</span>
                          <span>·</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {result.matchType === 'title' ? '标题匹配' : result.matchType === 'author' ? '作者匹配' : '内容匹配'}
                          </Badge>
                        </div>
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              )}

              {/* 搜索历史 */}
              {!query.trim() && searchHistory.length > 0 && (
                <>
                  <CommandGroup heading="最近搜索">
                    {searchHistory.map((item, index) => (
                      <CommandItem
                        key={index}
                        onSelect={() => handleSelectHistory(item)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{item}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeHistoryItem(item);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandItem
                    onSelect={clearHistory}
                    className="text-destructive justify-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    清除搜索历史
                  </CommandItem>
                </>
              )}

              {/* 空状态提示 */}
              {!query.trim() && searchHistory.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  输入关键词开始搜索，或按 ⌘K 快速打开
                </div>
              )}
            </CommandList>
          </Command>
        </>
      )}
    </div>
  );
}

/**
 * 搜索栏对话框（全屏版本）
 */
export function SearchBarDialog({
  sources,
  onSearch,
  onSelectResult,
}: Omit<SearchBarProps, 'className' | 'placeholder'>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-full justify-start rounded-md bg-muted/50 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted sm:pr-12 md:w-40 lg:w-64"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        搜索...
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* TODO: 使用 CommandDialog 实现全屏搜索对话框 */}
    </>
  );
}

export default SearchBar;
