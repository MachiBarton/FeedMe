import { useEffect, useState } from 'react';

/**
 * 从 hash 路由的 URL 中解析查询参数
 * 支持格式: #/path?key=value
 */
function getHashSearchParams(): URLSearchParams {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex === -1) {
    return new URLSearchParams();
  }
  const queryString = hash.slice(queryIndex + 1);
  return new URLSearchParams(queryString);
}

/**
 * 从标准 URL 查询参数中解析
 * 支持格式: ?key=value
 */
function getStandardSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

/**
 * 合并标准查询参数和 hash 路由查询参数
 * 优先使用 hash 路由参数（如果存在）
 */
function getMergedSearchParams(): URLSearchParams {
  const standardParams = getStandardSearchParams();
  const hashParams = getHashSearchParams();

  // 创建一个新的 URLSearchParams，先合并标准参数，再用 hash 参数覆盖
  const merged = new URLSearchParams();

  // 先添加所有标准参数
  standardParams.forEach((value, key) => {
    merged.set(key, value);
  });

  // 再用 hash 参数覆盖（hash 参数优先级更高）
  hashParams.forEach((value, key) => {
    merged.set(key, value);
  });

  return merged;
}

/**
 * Custom hook to read URL search parameters from hash route
 * Replacement for Next.js useSearchParams
 */
export function useSearchParams() {
  const [searchParams, setSearchParams] = useState(() => getMergedSearchParams());

  useEffect(() => {
    const handlePopState = () => {
      setSearchParams(getMergedSearchParams());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  return searchParams;
}

/**
 * Custom hook to navigate between pages
 * Replacement for Next.js useRouter
 */
export function useRouter() {
  const push = (url: string) => {
    window.history.pushState({}, '', url);
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const replace = (url: string) => {
    window.history.replaceState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return {
    push,
    replace,
  };
}
