import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserPreferences } from '@/lib/types';

const STORAGE_KEY = 'feedme:user-preferences';

// 全局状态 - 所有组件实例共享
let globalPreferences: UserPreferences | null = null;
const globalListeners = new Set<(prefs: UserPreferences) => void>();

// 自定义事件名称
const PREFERENCES_CHANGE_EVENT = 'feedme:preferences-change';

/**
 * 通知所有监听器
 */
function notifyGlobalListeners(prefs: UserPreferences): void {
  globalListeners.forEach(listener => listener(prefs));
}

/**
 * 触发全局事件
 */
function dispatchChangeEvent(prefs: UserPreferences): void {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent(PREFERENCES_CHANGE_EVENT, { detail: prefs });
    window.dispatchEvent(event);
  }
}

/**
 * 默认用户偏好设置
 */
const defaultPreferences: UserPreferences = {
  id: 'default',
  theme: 'system',
  fontSize: 'medium',
  fontFamily: 'sans',
  lineHeight: 'normal',
  articleLayout: 'card',  // card | compact | grid | masonry | magazine | text
  autoMarkAsRead: false,
  autoMarkAsReadDelay: 3000,
  showUnreadOnly: false,
  sortBy: 'date',
  sortOrder: 'desc',
  itemsPerPage: 20,
  fetchInterval: 30,
  maxArticlesPerSource: 50,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

/**
 * 从 localStorage 加载偏好设置
 */
function loadPreferencesFromStorage(): UserPreferences | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserPreferences;
      // 合并默认值，确保新添加的字段存在
      return { ...defaultPreferences, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load preferences from localStorage:', error);
  }
  return null;
}

/**
 * 保存偏好设置到 localStorage
 */
function savePreferencesToStorage(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save preferences to localStorage:', error);
  }
}

/**
 * 用户偏好管理 Hook
 *
 * @example
 * ```tsx
 * const { preferences, updatePreferences, resetPreferences } = usePreferences();
 *
 * // 更新主题
 * updatePreferences({ theme: 'dark' });
 *
 * // 更新多个设置
 * updatePreferences({ fontSize: 'large', itemsPerPage: 50 });
 * ```
 */
export function usePreferences() {
  // 使用全局状态初始化，避免闪烁
  const [preferences, setPreferences] = useState<UserPreferences>(
    globalPreferences ?? loadPreferencesFromStorage() ?? defaultPreferences
  );
  const [isLoading, setIsLoading] = useState(globalPreferences === null);
  const isMountedRef = useRef(true);

  // 初始化：同步全局状态
  useEffect(() => {
    isMountedRef.current = true;

    // 如果全局状态还没有加载，从 localStorage 加载
    if (globalPreferences === null) {
      const loaded = loadPreferencesFromStorage();
      if (loaded) {
        globalPreferences = loaded;
        setPreferences(loaded);
      } else {
        globalPreferences = defaultPreferences;
      }
      setIsLoading(false);
    }

    // 订阅全局变更
    const handleGlobalChange = (prefs: UserPreferences) => {
      if (isMountedRef.current) {
        setPreferences(prefs);
      }
    };

    // 订阅自定义事件（用于同页面通信）
    const handleCustomEvent = (event: CustomEvent<UserPreferences>) => {
      if (isMountedRef.current) {
        setPreferences(event.detail);
      }
    };

    globalListeners.add(handleGlobalChange);
    window.addEventListener(PREFERENCES_CHANGE_EVENT, handleCustomEvent as EventListener);

    return () => {
      isMountedRef.current = false;
      globalListeners.delete(handleGlobalChange);
      window.removeEventListener(PREFERENCES_CHANGE_EVENT, handleCustomEvent as EventListener);
    };
  }, []);

  // 监听其他标签页的更改（storage 事件）
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const newPrefs = JSON.parse(event.newValue) as UserPreferences;
          const merged = { ...defaultPreferences, ...newPrefs };
          globalPreferences = merged;
          setPreferences(merged);
          notifyGlobalListeners(merged);
        } catch (error) {
          console.error('Failed to parse preferences from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * 更新偏好设置
   */
  const updatePreferences = useCallback((updates: Partial<Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const newPreferences: UserPreferences = {
      ...preferences,
      ...updates,
      updatedAt: Date.now(),
    };

    // 更新全局状态
    globalPreferences = newPreferences;

    // 保存到 localStorage
    savePreferencesToStorage(newPreferences);

    // 通知所有监听器（同页面内）
    notifyGlobalListeners(newPreferences);

    // 触发自定义事件
    dispatchChangeEvent(newPreferences);

    // 更新本地 state
    setPreferences(newPreferences);
  }, [preferences]);

  /**
   * 重置为默认设置
   */
  const resetPreferences = useCallback(() => {
    const resetPrefs: UserPreferences = {
      ...defaultPreferences,
      createdAt: preferences.createdAt,
      updatedAt: Date.now(),
    };

    globalPreferences = resetPrefs;
    savePreferencesToStorage(resetPrefs);
    notifyGlobalListeners(resetPrefs);
    dispatchChangeEvent(resetPrefs);
    setPreferences(resetPrefs);
  }, [preferences.createdAt]);

  /**
   * 订阅偏好设置变更
   */
  const subscribe = useCallback((callback: (prefs: UserPreferences) => void) => {
    globalListeners.add(callback);
    return () => {
      globalListeners.delete(callback);
    };
  }, []);

  /**
   * 获取当前主题（处理 'system' 值）
   */
  const getEffectiveTheme = useCallback((): 'light' | 'dark' => {
    if (preferences.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return preferences.theme;
  }, [preferences.theme]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    resetPreferences,
    subscribe,
    getEffectiveTheme,
  };
}

/**
 * 获取字体大小对应的 CSS 类名
 */
export function getFontSizeClass(fontSize: UserPreferences['fontSize']): string {
  const classes: Record<UserPreferences['fontSize'], string> = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };
  return classes[fontSize];
}

/**
 * 获取字体家族对应的 CSS 类名
 */
export function getFontFamilyClass(fontFamily: UserPreferences['fontFamily']): string {
  const classes: Record<UserPreferences['fontFamily'], string> = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  };
  return classes[fontFamily];
}

/**
 * 获取行高对应的 CSS 类名
 */
export function getLineHeightClass(lineHeight: UserPreferences['lineHeight']): string {
  const classes: Record<UserPreferences['lineHeight'], string> = {
    compact: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
  };
  return classes[lineHeight];
}

/**
 * 直接获取偏好设置（同步方法，用于非 React 上下文）
 */
export function getPreferencesSync(): UserPreferences {
  return globalPreferences ?? loadPreferencesFromStorage() ?? defaultPreferences;
}

/**
 * 直接更新偏好设置（同步方法，用于非 React 上下文）
 */
export function updatePreferencesSync(
  updates: Partial<Omit<UserPreferences, 'id' | 'createdAt' | 'updatedAt'>>
): void {
  const current = getPreferencesSync();
  const newPreferences: UserPreferences = {
    ...current,
    ...updates,
    updatedAt: Date.now(),
  };
  globalPreferences = newPreferences;
  savePreferencesToStorage(newPreferences);
  notifyGlobalListeners(newPreferences);
  dispatchChangeEvent(newPreferences);
}

export default usePreferences;
