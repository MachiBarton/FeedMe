import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  usePreferences,
  getFontSizeClass,
  getFontFamilyClass,
  getLineHeightClass,
  getPreferencesSync,
  updatePreferencesSync,
} from '../use-preferences'
import type { UserPreferences } from '@/lib/types'

describe('usePreferences', () => {
  const mockPreferences: UserPreferences = {
    id: 'default',
    theme: 'dark',
    fontSize: 'large',
    fontFamily: 'serif',
    lineHeight: 'relaxed',
    articleLayout: 'list',
    autoMarkAsRead: true,
    autoMarkAsReadDelay: 5000,
    showUnreadOnly: true,
    sortBy: 'title',
    sortOrder: 'asc',
    itemsPerPage: 50,
    fetchInterval: 60,
    maxArticlesPerSource: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  beforeEach(() => {
    // Clear localStorage and reset mocks before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    localStorage.clear()
  })

  describe('usePreferences hook', () => {
    it('should initialize with default preferences', () => {
      const { result } = renderHook(() => usePreferences())

      expect(result.current.preferences.theme).toBe('system')
      expect(result.current.preferences.fontSize).toBe('medium')
      expect(result.current.isLoading).toBe(true)
    })

    it('should load preferences from localStorage', async () => {
      localStorage.setItem('feedme:user-preferences', JSON.stringify(mockPreferences))

      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.preferences.theme).toBe('dark')
      expect(result.current.preferences.fontSize).toBe('large')
    })

    it('should merge defaults with stored preferences', async () => {
      const partialPrefs = { theme: 'light' as const }
      localStorage.setItem('feedme:user-preferences', JSON.stringify(partialPrefs))

      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.preferences.theme).toBe('light')
      expect(result.current.preferences.fontSize).toBe('medium') // default
    })

    it('should update preferences', async () => {
      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updatePreferences({ theme: 'dark' })
      })

      expect(result.current.preferences.theme).toBe('dark')

      // Verify localStorage
      const stored = JSON.parse(localStorage.getItem('feedme:user-preferences') || '{}')
      expect(stored.theme).toBe('dark')
    })

    it('should update multiple preferences at once', async () => {
      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      act(() => {
        result.current.updatePreferences({
          theme: 'light',
          fontSize: 'small',
          itemsPerPage: 10,
        })
      })

      expect(result.current.preferences.theme).toBe('light')
      expect(result.current.preferences.fontSize).toBe('small')
      expect(result.current.preferences.itemsPerPage).toBe(10)
    })

    it('should update updatedAt timestamp', async () => {
      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const beforeUpdate = result.current.preferences.updatedAt

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      act(() => {
        result.current.updatePreferences({ theme: 'dark' })
      })

      expect(result.current.preferences.updatedAt).toBeGreaterThan(beforeUpdate)
    })

    it('should reset to defaults', async () => {
      localStorage.setItem('feedme:user-preferences', JSON.stringify(mockPreferences))

      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.preferences.theme).toBe('dark')

      act(() => {
        result.current.resetPreferences()
      })

      expect(result.current.preferences.theme).toBe('system')
      expect(result.current.preferences.fontSize).toBe('medium')
    })

    it('should preserve createdAt when resetting', async () => {
      localStorage.setItem('feedme:user-preferences', JSON.stringify(mockPreferences))

      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const originalCreatedAt = result.current.preferences.createdAt

      act(() => {
        result.current.resetPreferences()
      })

      expect(result.current.preferences.createdAt).toBe(originalCreatedAt)
    })

    it('should get effective theme', async () => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // System theme with dark preference
      expect(result.current.getEffectiveTheme()).toBe('dark')

      // Set to light explicitly
      act(() => {
        result.current.updatePreferences({ theme: 'light' })
      })

      expect(result.current.getEffectiveTheme()).toBe('light')
    })

    it('should subscribe to preference changes', async () => {
      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const callback = vi.fn()
      let unsubscribe: (() => void) | undefined

      act(() => {
        unsubscribe = result.current.subscribe(callback)
      })

      act(() => {
        result.current.updatePreferences({ theme: 'dark' })
      })

      expect(callback).toHaveBeenCalled()

      act(() => {
        unsubscribe?.()
      })

      expect(unsubscribe).toBeDefined()
    })

    it('should sync across tabs via storage event', async () => {
      const { result } = renderHook(() => usePreferences())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Simulate storage event from another tab
      const newPrefs = { ...mockPreferences, theme: 'light' as const }

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'feedme:user-preferences',
          newValue: JSON.stringify(newPrefs),
        })
        window.dispatchEvent(event)
      })

      await waitFor(() => {
        expect(result.current.preferences.theme).toBe('light')
      })
    })
  })

  describe('CSS class helpers', () => {
    it('should return correct font size classes', () => {
      expect(getFontSizeClass('small')).toBe('text-sm')
      expect(getFontSizeClass('medium')).toBe('text-base')
      expect(getFontSizeClass('large')).toBe('text-lg')
    })

    it('should return correct font family classes', () => {
      expect(getFontFamilyClass('sans')).toBe('font-sans')
      expect(getFontFamilyClass('serif')).toBe('font-serif')
      expect(getFontFamilyClass('mono')).toBe('font-mono')
    })

    it('should return correct line height classes', () => {
      expect(getLineHeightClass('compact')).toBe('leading-snug')
      expect(getLineHeightClass('normal')).toBe('leading-normal')
      expect(getLineHeightClass('relaxed')).toBe('leading-relaxed')
    })
  })

  describe('sync functions', () => {
    it('should get preferences synchronously', () => {
      localStorage.setItem('feedme:user-preferences', JSON.stringify(mockPreferences))

      const prefs = getPreferencesSync()
      expect(prefs.theme).toBe('dark')
      expect(prefs.fontSize).toBe('large')
    })

    it('should return defaults when no preferences stored', () => {
      const prefs = getPreferencesSync()
      expect(prefs.theme).toBe('system')
      expect(prefs.fontSize).toBe('medium')
    })

    it('should update preferences synchronously', () => {
      updatePreferencesSync({ theme: 'dark' })

      const stored = JSON.parse(localStorage.getItem('feedme:user-preferences') || '{}')
      expect(stored.theme).toBe('dark')
    })

    it('should merge updates with existing preferences', () => {
      // Set initial preferences with both fields
      localStorage.setItem('feedme:user-preferences', JSON.stringify({ fontSize: 'large', theme: 'dark' }))

      updatePreferencesSync({ theme: 'light' })

      const stored = JSON.parse(localStorage.getItem('feedme:user-preferences') || '{}')
      // After update, theme should be changed
      expect(stored.theme).toBe('light')
      // Font size should be preserved from previous value
      expect(stored.fontSize).toBe('large')
    })
  })
})
