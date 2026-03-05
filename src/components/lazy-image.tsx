import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface LazyImageProps {
  /** 图片URL */
  src: string;
  /** 图片alt文本 */
  alt: string;
  /** 额外的CSS类 */
  className?: string;
  /** 容器额外的CSS类 */
  containerClassName?: string;
  /** 图片加载失败时的占位符 */
  fallback?: React.ReactNode;
  /** 图片加载时的占位符 */
  placeholder?: React.ReactNode;
  /** 图片加载完成回调 */
  onLoad?: () => void;
  /** 图片加载失败回调 */
  onError?: () => void;
  /** 是否使用缩略图 */
  useThumbnail?: boolean;
  /** 缩略图宽度 */
  thumbnailWidth?: number;
}

export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * 懒加载图片组件
 * 使用 Intersection Observer 实现图片懒加载
 * 当图片进入视口时才开始加载
 */
export function LazyImage({
  src,
  alt,
  className,
  containerClassName,
  fallback,
  placeholder,
  onLoad,
  onError,
  useThumbnail = true,
  thumbnailWidth = 400,
}: LazyImageProps) {
  const [loadState, setLoadState] = useState<ImageLoadState>('idle');
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const imgRef = useRef<HTMLDivElement>(null);

  // 处理图片 URL（使用缩略图服务）
  useEffect(() => {
    if (!src) {
      setLoadState('error');
      return;
    }

    if (useThumbnail) {
      // 使用 wsrv.nl 图片代理服务生成缩略图
      setImageSrc(`https://wsrv.nl/?url=${encodeURIComponent(src)}&w=${thumbnailWidth}&fit=cover&output=webp`);
    } else {
      setImageSrc(src);
    }
  }, [src, useThumbnail, thumbnailWidth]);

  // 使用 Intersection Observer 监听图片是否进入视口
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (loadState === 'idle') {
              setLoadState('loading');
            }
            observer.disconnect();
          }
        });
      },
      {
        // 提前 100px 开始加载，实现平滑过渡
        rootMargin: '100px',
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [loadState]);

  // 处理图片加载完成
  const handleLoad = useCallback(() => {
    setLoadState('loaded');
    onLoad?.();
  }, [onLoad]);

  // 处理图片加载失败
  const handleError = useCallback(() => {
    setLoadState('error');
    onError?.();
  }, [onError]);

  // 默认占位符
  const defaultPlaceholder = (
    <Skeleton className="w-full h-full" />
  );

  // 默认失败占位符
  const defaultFallback = (
    <div className="flex flex-col items-center justify-center w-full h-full bg-muted text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-2" />
      <span className="text-xs">加载失败</span>
    </div>
  );

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden',
        containerClassName
      )}
    >
      {/* 占位符/加载中状态 */}
      {(loadState === 'idle' || loadState === 'loading') && (
        <div className="absolute inset-0">
          {placeholder || defaultPlaceholder}
        </div>
      )}

      {/* 加载失败状态 */}
      {loadState === 'error' && (
        <div className="absolute inset-0">
          {fallback || defaultFallback}
        </div>
      )}

      {/* 实际图片 - 仅在进入视口时加载 */}
      {isInView && loadState !== 'error' && imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loadState === 'loaded' ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
}

/**
 * 文章缩略图组件
 * 专门用于文章卡片中的图片展示
 */
export interface ArticleThumbnailProps {
  /** 图片 URL */
  src: string | null;
  /** 文章标题（用于替代文本） */
  title: string;
  /** 额外的CSS类 */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
}

export function ArticleThumbnail({
  src,
  title,
  className,
}: ArticleThumbnailProps) {
  if (!src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg bg-muted flex items-center justify-center',
          className
        )}
      >
        <div className="flex flex-col items-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">无图片</span>
        </div>
      </div>
    );
  }

  return (
    <LazyImage
      src={src}
      alt={title}
      containerClassName={className}
      placeholder={<Skeleton className="w-full h-full" />}
      useThumbnail={true}
      thumbnailWidth={400}
    />
  );
}

/**
 * 图片画廊组件
 * 展示文章中的所有图片
 */
export interface ImageGalleryProps {
  /** 图片 URL 列表 */
  images: string[];
  /** 额外的CSS类 */
  className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
  if (images.length === 0) return null;

  // 最多显示 4 张图片
  const displayImages = images.slice(0, 4);
  const remainingCount = images.length - 4;

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      {displayImages.map((src, index) => (
        <div
          key={index}
          className={cn(
            'relative aspect-video overflow-hidden rounded-lg',
            images.length === 1 && 'col-span-2',
            images.length === 3 && index === 0 && 'col-span-2'
          )}
        >
          <LazyImage
            src={src}
            alt={`图片 ${index + 1}`}
            className="w-full h-full"
            placeholder={<Skeleton className="w-full h-full" />}
            useThumbnail={true}
            thumbnailWidth={400}
          />
          {index === 3 && remainingCount > 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
              +{remainingCount}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 从文章内容中提取第一张图片
 * @param content HTML内容
 * @returns 图片URL或null
 */
export function extractFirstImage(content: string | undefined): string | null {
  if (!content) return null;

  // 创建DOM解析器
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  // 查找第一张图片
  const img = doc.querySelector('img');
  if (img && img.src) {
    return img.src;
  }

  return null;
}

/**
 * 从 HTML 内容中提取所有图片
 */
export function extractAllImages(content: string | undefined): string[] {
  if (!content) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const images = doc.querySelectorAll('img');

  return Array.from(images)
    .map(img => img.src)
    .filter(src => src && src.startsWith('http'));
}

/**
 * 检查FeedItem是否包含图片
 * @param item FeedItem
 * @returns 是否包含图片
 */
export function hasImage(item: { content?: string; enclosure?: { url: string; type: string } }): boolean {
  // 检查enclosure（RSS附件）
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return true;
  }

  // 检查内容中的图片
  if (item.content && extractFirstImage(item.content)) {
    return true;
  }

  return false;
}

/**
 * 获取FeedItem的图片URL
 * @param item FeedItem
 * @returns 图片URL或null
 */
export function getImageUrl(item: { content?: string; enclosure?: { url: string; type: string } }): string | null {
  // 优先使用enclosure（RSS附件）
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }

  // 从内容中提取
  if (item.content) {
    return extractFirstImage(item.content);
  }

  return null;
}

export default LazyImage;
