import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Check,
  ChevronDown,
} from 'lucide-react';

// 排序类型
export type SortType = 'date-desc' | 'date-asc' | 'source' | 'title';

// 排序选项
const sortOptions: { value: SortType; label: string }[] = [
  { value: 'date-desc', label: '最新优先' },
  { value: 'date-asc', label: '最早优先' },
  { value: 'source', label: '按来源' },
  { value: 'title', label: '按标题' },
];

export interface ArticleFilterProps {
  /** 当前排序 */
  currentSort: SortType;
  /** 排序变更回调 */
  onSortChange: (sort: SortType) => void;
  /** 额外的CSS类 */
  className?: string;
}

/**
 * 文章过滤器组件
 * 仅保留排序功能
 */
export function ArticleFilter({
  currentSort,
  onSortChange,
  className,
}: ArticleFilterProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  return (
    <div className={cn('flex items-center justify-end', className)}>
      {/* 排序选择器 */}
      <Popover open={showSortMenu} onOpenChange={setShowSortMenu}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <span className="text-muted-foreground">排序:</span>
            {sortOptions.find(s => s.value === currentSort)?.label}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-40 p-1">
          {sortOptions.map((option) => (
            <Button
              key={option.value}
              variant={currentSort === option.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                onSortChange(option.value);
                setShowSortMenu(false);
              }}
              className="w-full justify-start"
            >
              {currentSort === option.value && (
                <Check className="h-4 w-4 mr-2" />
              )}
              <span className={currentSort === option.value ? '' : 'ml-6'}>
                {option.label}
              </span>
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * 排序文章列表
 */
export function sortArticles<T extends { pubDate?: string; title?: string; sourceId?: string }>(
  articles: T[],
  sort: SortType
): T[] {
  return [...articles].sort((a, b) => {
    switch (sort) {
      case 'date-desc': {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateB - dateA;
      }
      case 'date-asc': {
        const dateA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
        const dateB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
        return dateA - dateB;
      }
      case 'source':
        return (a.sourceId || '').localeCompare(b.sourceId || '');
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });
}

export default ArticleFilter;
