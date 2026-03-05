import type { FeedItem } from '@/lib/types';

/**
 * 从 FeedItem 提取图片 URL
 */
export function extractImageUrl(item: FeedItem): string | null {
  // 1. 优先使用 enclosure 字段的图片
  if (item.enclosure?.url && isImageUrl(item.enclosure.url)) {
    return item.enclosure.url;
  }

  // 2. 从 content 中提取首图
  if (item.content) {
    const imageUrl = extractFirstImageFromHtml(item.content);
    if (imageUrl) return imageUrl;
  }

  // 3. 从 contentSnippet 中提取
  if (item.contentSnippet) {
    const imageUrl = extractFirstImageFromHtml(item.contentSnippet);
    if (imageUrl) return imageUrl;
  }

  return null;
}

/**
 * 从 HTML 内容中提取第一张图片
 */
export function extractFirstImageFromHtml(html: string): string | null {
  // 匹配 img 标签的 src 属性
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i;
  const match = html.match(imgRegex);

  if (match && match[1]) {
    const url = match[1];
    // 过滤掉数据 URI 和无效 URL
    if (isValidImageUrl(url)) {
      return url;
    }
  }

  // 尝试匹配 background-image
  const bgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/i;
  const bgMatch = html.match(bgRegex);
  if (bgMatch && bgMatch[1]) {
    const url = bgMatch[1];
    if (isValidImageUrl(url)) {
      return url;
    }
  }

  return null;
}

/**
 * 从 HTML 内容中提取所有图片
 */
export function extractAllImagesFromHtml(html: string): string[] {
  const images: string[] = [];

  // 匹配所有 img 标签
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    if (isValidImageUrl(url) && !images.includes(url)) {
      images.push(url);
    }
  }

  return images;
}

/**
 * 检查 URL 是否为图片
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;

  // 检查文件扩展名
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowerUrl = url.toLowerCase();

  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * 检查是否为有效的图片 URL
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // 排除数据 URI（通常太大，不适合作为缩略图）
  if (url.startsWith('data:')) return false;

  // 排除 javascript: 伪协议
  if (url.startsWith('javascript:')) return false;

  // 排除相对路径（需要转换为绝对路径）
  if (url.startsWith('//')) return true; // 协议相对 URL

  // 必须是 http 或 https
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * 获取图片的代理 URL（用于跨域图片）
 */
export function getImageProxyUrl(url: string): string {
  // 如果已经是相对路径或数据 URI，直接返回
  if (!url.startsWith('http')) return url;

  // 这里可以配置图片代理服务
  // 例如使用 wsrv.nl 或类似的图片代理
  // return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=400`;

  return url;
}

/**
 * 生成缩略图 URL
 */
export function getThumbnailUrl(url: string, width: number = 400): string {
  if (!url) return '';

  // 使用 wsrv.nl 图片代理服务生成缩略图
  // 支持 WebP 格式，自动压缩
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${width}&fit=cover&output=webp`;
}

/**
 * 生成占位图 URL
 */
export function getPlaceholderUrl(text: string = 'No Image'): string {
  // 使用占位图服务
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/400x300/e2e8f0/64748b?text=${encodedText}`;
}

/**
 * 预加载图片
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * 批量预加载图片
 */
export function preloadImages(urls: string[], concurrency: number = 3): Promise<void> {
  return new Promise((resolve) => {
    let loaded = 0;
    let index = 0;

    const loadNext = () => {
      if (index >= urls.length) {
        if (loaded >= urls.length) {
          resolve();
        }
        return;
      }

      const url = urls[index++];
      preloadImage(url)
        .then(() => {
          loaded++;
          loadNext();
        })
        .catch(() => {
          loaded++;
          loadNext();
        });
    };

    // 同时启动多个并发加载
    for (let i = 0; i < Math.min(concurrency, urls.length); i++) {
      loadNext();
    }
  });
}

/**
 * 图片加载状态
 */
export type ImageLoadState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * 使用 Intersection Observer 实现图片懒加载
 */
export function useLazyImage(
  src: string,
  options?: IntersectionObserverInit
): {
  ref: React.RefObject<HTMLImageElement>;
  shouldLoad: boolean;
  loadState: ImageLoadState;
} {
  const ref = { current: null as HTMLImageElement | null };
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loadState, setLoadState] = useState<ImageLoadState>('idle');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          setLoadState('loading');
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px 0px', // 提前 50px 开始加载
        threshold: 0,
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  // 监听图片加载状态
  useEffect(() => {
    if (!shouldLoad || !ref.current) return;

    const img = ref.current;

    const handleLoad = () => setLoadState('loaded');
    const handleError = () => setLoadState('error');

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // 如果图片已经加载完成
    if (img.complete) {
      setLoadState(img.naturalWidth > 0 ? 'loaded' : 'error');
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [shouldLoad, src]);

  return { ref, shouldLoad, loadState };
}

import { useState, useEffect, useRef } from 'react';

export default {
  extractImageUrl,
  extractFirstImageFromHtml,
  extractAllImagesFromHtml,
  isImageUrl,
  isValidImageUrl,
  getImageProxyUrl,
  getThumbnailUrl,
  getPlaceholderUrl,
  preloadImage,
  preloadImages,
};
