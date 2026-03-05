import { describe, it, expect } from 'vitest'
import type { FeedItem, Feed, FeedData } from '../types'

describe('Type Definitions', () => {
  describe('FeedItem', () => {
    it('should accept valid FeedItem object', () => {
      const item: FeedItem = {
        title: 'Test Article',
        link: 'https://example.com/article',
        pubDate: '2024-01-01',
        isoDate: '2024-01-01T00:00:00Z',
        content: '<p>Test content</p>',
        contentSnippet: 'Test content',
        creator: 'Test Author',
        summary: 'Test summary',
        enclosure: {
          url: 'https://example.com/image.jpg',
          type: 'image/jpeg',
        },
      }

      expect(item.title).toBe('Test Article')
      expect(item.link).toBe('https://example.com/article')
      expect(item.enclosure?.url).toBe('https://example.com/image.jpg')
    })

    it('should accept minimal FeedItem with only title', () => {
      const item: FeedItem = {
        title: 'Minimal Article',
      }

      expect(item.title).toBe('Minimal Article')
      expect(item.link).toBeUndefined()
    })

    it('should handle optional fields correctly', () => {
      const item: FeedItem = {
        title: 'Test',
        link: 'https://example.com',
      }

      expect(item.content).toBeUndefined()
      expect(item.summary).toBeUndefined()
    })
  })

  describe('Feed', () => {
    it('should accept valid Feed object', () => {
      const feed: Feed = {
        title: 'Test Feed',
        description: 'A test feed',
        link: 'https://example.com',
        items: [
          {
            title: 'Article 1',
            link: 'https://example.com/1',
          },
          {
            title: 'Article 2',
            link: 'https://example.com/2',
          },
        ],
      }

      expect(feed.title).toBe('Test Feed')
      expect(feed.items).toHaveLength(2)
    })

    it('should accept empty items array', () => {
      const feed: Feed = {
        title: 'Empty Feed',
        description: 'Empty',
        link: 'https://example.com',
        items: [],
      }

      expect(feed.items).toHaveLength(0)
    })
  })

  describe('FeedData', () => {
    it('should accept valid FeedData object', () => {
      const feedData: FeedData = {
        sourceUrl: 'https://example.com/rss',
        title: 'Test Feed Data',
        description: 'Description',
        link: 'https://example.com',
        items: [],
        lastUpdated: '2024-01-01T00:00:00Z',
      }

      expect(feedData.sourceUrl).toBe('https://example.com/rss')
      expect(feedData.lastUpdated).toBe('2024-01-01T00:00:00Z')
    })

    it('should require all mandatory fields', () => {
      // This should compile without errors
      const feedData: FeedData = {
        sourceUrl: 'https://example.com/rss',
        title: 'Test',
        description: '',
        link: '',
        items: [],
        lastUpdated: new Date().toISOString(),
      }

      expect(feedData).toBeDefined()
    })
  })
})
