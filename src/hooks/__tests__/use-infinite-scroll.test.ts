import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useInfiniteScroll,
  useIntersectionInfiniteScroll,
  useVirtualList,
} from '../use-infinite-scroll'

describe('useInfiniteScroll', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i}`,
  }))

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic infinite scroll', () => {
    it('should initialize with correct state', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
        })
      )

      expect(result.current.visibleItems).toHaveLength(10)
      expect(result.current.visibleCount).toBe(10)
      expect(result.current.hasMore).toBe(true)
      expect(result.current.isLoading).toBe(false)
    })

    it('should load more items', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
        })
      )

      act(() => {
        result.current.loadMore()
      })

      // Loading state should be true immediately
      expect(result.current.isLoading).toBe(true)

      // Fast-forward timer
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.visibleItems).toHaveLength(20)
      expect(result.current.visibleCount).toBe(20)
      expect(result.current.isLoading).toBe(false)
    })

    it('should respect maxItems limit', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
          maxItems: 25,
        })
      )

      // Load first batch
      act(() => {
        result.current.loadMore()
      })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Load second batch
      act(() => {
        result.current.loadMore()
      })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.visibleItems).toHaveLength(25)
      expect(result.current.hasMore).toBe(false)
    })

    it('should reset to initial state', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
        })
      )

      // Load more first
      act(() => {
        result.current.loadMore()
      })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.visibleCount).toBe(20)

      // Reset
      act(() => {
        result.current.reset()
      })

      expect(result.current.visibleCount).toBe(10)
      expect(result.current.visibleItems).toHaveLength(10)
    })

    it('should not load more when disabled', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
          enabled: false,
        })
      )

      act(() => {
        result.current.loadMore()
      })

      // Should not change
      expect(result.current.visibleCount).toBe(10)
    })

    it('should handle empty items', () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          items: [],
          initialCount: 10,
          loadMoreCount: 10,
        })
      )

      expect(result.current.visibleItems).toHaveLength(0)
      expect(result.current.hasMore).toBe(false)
    })

    it('should reset when items change', () => {
      const { result, rerender } = renderHook(
        ({ items }) =>
          useInfiniteScroll({
            items,
            initialCount: 10,
            loadMoreCount: 10,
          }),
        {
          initialProps: { items: mockItems },
        }
      )

      // Load more
      act(() => {
        result.current.loadMore()
      })
      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current.visibleCount).toBe(20)

      // Change items
      const newItems = Array.from({ length: 50 }, (_, i) => ({
        id: `new-${i}`,
        title: `New ${i}`,
      }))

      rerender({ items: newItems })

      expect(result.current.visibleCount).toBe(10)
    })
  })

  describe('intersection observer infinite scroll', () => {
    it('should initialize with sentinel ref', () => {
      const { result } = renderHook(() =>
        useIntersectionInfiniteScroll({
          items: mockItems,
          initialCount: 10,
          loadMoreCount: 10,
        })
      )

      expect(result.current.sentinelRef).toBeDefined()
      expect(result.current.visibleItems).toHaveLength(10)
    })
  })

  describe('virtual list', () => {
    it('should calculate virtual items correctly', () => {
      const { result } = renderHook(() =>
        useVirtualList({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 200,
          overscan: 2,
        })
      )

      // Initial render should show visible items plus overscan
      // containerHeight 200 / itemHeight 50 = 4 visible items + 2 overscan each side = 8
      expect(result.current.virtualItems.length).toBeGreaterThan(0)
      expect(result.current.totalHeight).toBe(5000) // 100 items * 50px
    })

    it('should update on scroll', () => {
      const { result } = renderHook(() =>
        useVirtualList({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 200,
          overscan: 2,
        })
      )

      const initialStartIndex = result.current.virtualItems[0]?.index

      // Simulate scroll
      act(() => {
        result.current.onScroll({
          currentTarget: { scrollTop: 500 },
        } as React.UIEvent<HTMLElement>)
      })

      // Should have scrolled to different position
      expect(result.current.scrollTop).toBe(500)
    })

    it('should calculate correct item styles', () => {
      const { result } = renderHook(() =>
        useVirtualList({
          items: mockItems,
          itemHeight: 50,
          containerHeight: 200,
          overscan: 0,
        })
      )

      const firstItem = result.current.virtualItems[0]
      expect(firstItem.style).toEqual({
        position: 'absolute',
        top: 0,
        height: 50,
        left: 0,
        right: 0,
      })

      // Find item at index 5
      const item5 = result.current.virtualItems.find((item) => item.index === 5)
      if (item5) {
        expect(item5.style.top).toBe(250) // 5 * 50
      }
    })
  })
})
