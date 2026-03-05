import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadFeedData, getAllCachedSources, mergeFeedItems } from '../data-store'
import { config } from '@/config/rss-config'
import type { FeedItem } from '../types'

// Mock the config
vi.mock('@/config/rss-config', () => ({
  config: {
    sources: [
      { url: 'https://example1.com/rss', name: 'Source 1', category: 'Tech' },
      { url: 'https://example2.com/rss', name: 'Source 2', category: 'News' },
    ],
    maxItemsPerFeed: 50,
  },
  findSourceByUrl: vi.fn((url: string) => {
    return config.sources.find(s => s.url === url)
  }),
  defaultSource: { url: 'https://example1.com/rss', name: 'Source 1', category: 'Tech' },
}))

describe('data-store', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('loadFeedData', () => {
    it('should load feed data successfully', async () => {
      const mockData = {
        sourceUrl: 'https://example.com/rss',
        title: 'Test Feed',
        description: 'Test Description',
        link: 'https://example.com',
        items: [],
        lastUpdated: '2024-01-01T00:00:00Z',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response)

      const result = await loadFeedData('https://example.com/rss')

      expect(result).toEqual(mockData)
    })

    it('should return null when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response)

      const result = await loadFeedData('https://example.com/rss')

      expect(result).toBeNull()
    })

    it('should return null when fetch throws error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await loadFeedData('https://example.com/rss')

      expect(result).toBeNull()
    })

    it('should handle invalid source URL', async () => {
      const result = await loadFeedData('')

      expect(result).toBeNull()
    })
  })

  describe('getAllCachedSources', () => {
    it('should return all source URLs from config', async () => {
      const sources = await getAllCachedSources()

      expect(sources).toHaveLength(2)
      expect(sources).toContain('https://example1.com/rss')
      expect(sources).toContain('https://example2.com/rss')
    })
  })

  describe('mergeFeedItems', () => {
    it('should merge old and new items correctly', async () => {
      const oldItems: FeedItem[] = [
        { title: 'Old 1', link: 'https://example.com/1', summary: 'Summary 1' },
        { title: 'Old 2', link: 'https://example.com/2' },
      ]

      const newItems: FeedItem[] = [
        { title: 'New 1', link: 'https://example.com/1', content: 'New content' },
        { title: 'New 3', link: 'https://example.com/3' },
      ]

      const result = await mergeFeedItems(oldItems, newItems, 50)

      expect(result.mergedItems).toHaveLength(2)
      expect(result.newItemsForSummary).toHaveLength(1)
      expect(result.newItemsForSummary[0].link).toBe('https://example.com/3')
    })

    it('should preserve existing summaries', async () => {
      const oldItems: FeedItem[] = [
        { title: 'Article', link: 'https://example.com/1', summary: 'Existing summary' },
      ]

      const newItems: FeedItem[] = [
        { title: 'Article Updated', link: 'https://example.com/1', content: 'New content' },
      ]

      const result = await mergeFeedItems(oldItems, newItems, 50)

      expect(result.mergedItems[0].summary).toBe('Existing summary')
    })

    it('should respect maxItems limit', async () => {
      const newItems: FeedItem[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/${i}`,
      }))

      const result = await mergeFeedItems([], newItems, 50)

      expect(result.mergedItems).toHaveLength(50)
    })

    it('should handle empty arrays', async () => {
      const result = await mergeFeedItems([], [], 50)

      expect(result.mergedItems).toHaveLength(0)
      expect(result.newItemsForSummary).toHaveLength(0)
    })

    it('should handle items without links', async () => {
      const oldItems: FeedItem[] = [
        { title: 'No link article' },
      ]

      const newItems: FeedItem[] = [
        { title: 'Another no link' },
      ]

      const result = await mergeFeedItems(oldItems, newItems, 50)

      expect(result.mergedItems).toHaveLength(0)
    })

    it('should handle enclosure serialization', async () => {
      const oldItems: FeedItem[] = []
      const newItems: FeedItem[] = [
        {
          title: 'Article with image',
          link: 'https://example.com/1',
          enclosure: {
            url: 'https://example.com/image.jpg',
            type: 'image/jpeg',
          },
        },
      ]

      const result = await mergeFeedItems(oldItems, newItems, 50)

      expect(result.mergedItems[0].enclosure).toEqual({
        url: 'https://example.com/image.jpg',
        type: 'image/jpeg',
      })
    })
  })
})
