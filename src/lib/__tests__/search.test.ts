import { describe, it, expect, beforeEach } from 'vitest'

// Mock search types and functions
interface SearchableItem {
  id: string
  title: string
  content: string
  summary?: string
}

interface SearchResult {
  item: SearchableItem
  score: number
  matches: string[]
}

class SearchEngine {
  private items: SearchableItem[] = []
  private cache: Map<string, SearchResult[]> = new Map()

  index(items: SearchableItem[]): void {
    this.items = items
    this.cache.clear()
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return []
    }

    // Check cache
    const cached = this.cache.get(query)
    if (cached) {
      return cached
    }

    const results: SearchResult[] = []
    const lowerQuery = query.toLowerCase()
    const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0)

    for (const item of this.items) {
      const titleLower = item.title.toLowerCase()
      const contentLower = item.content.toLowerCase()
      const summaryLower = item.summary?.toLowerCase() || ''

      let score = 0
      const matches: string[] = []

      for (const term of terms) {
        // Title matches get higher score
        if (titleLower.includes(term)) {
          score += 10
          matches.push(term)
        }

        // Summary matches get medium score
        if (summaryLower.includes(term)) {
          score += 5
          matches.push(term)
        }

        // Content matches get lower score
        if (contentLower.includes(term)) {
          score += 1
          matches.push(term)
        }
      }

      if (score > 0) {
        results.push({
          item,
          score,
          matches: [...new Set(matches)],
        })
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    // Cache results
    this.cache.set(query, results)

    return results
  }

  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

describe('Search', () => {
  let engine: SearchEngine

  beforeEach(() => {
    engine = new SearchEngine()
  })

  describe('basic search', () => {
    it('should return matching results', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React basics' },
        { id: '2', title: 'Vue Guide', content: 'Learn Vue framework' },
        { id: '3', title: 'Angular Intro', content: 'Angular for beginners' },
      ])

      const results = engine.search('react')

      expect(results).toHaveLength(1)
      expect(results[0].item.title).toBe('React Tutorial')
    })

    it('should return multiple matching results', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React basics' },
        { id: '2', title: 'React Advanced', content: 'Advanced React patterns' },
        { id: '3', title: 'Vue Guide', content: 'Learn Vue framework' },
      ])

      const results = engine.search('react')

      expect(results).toHaveLength(2)
    })

    it('should search in content', () => {
      engine.index([
        { id: '1', title: 'Tutorial', content: 'Learn React basics' },
        { id: '2', title: 'Guide', content: 'Learn Vue framework' },
      ])

      const results = engine.search('react')

      expect(results).toHaveLength(1)
      expect(results[0].item.id).toBe('1')
    })

    it('should return empty array for no matches', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      const results = engine.search('angular')

      expect(results).toHaveLength(0)
    })

    it('should handle empty query', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      const results = engine.search('')

      expect(results).toHaveLength(0)
    })

    it('should handle whitespace-only query', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      const results = engine.search('   ')

      expect(results).toHaveLength(0)
    })
  })

  describe('multi-term search', () => {
    it('should search with multiple terms', () => {
      engine.index([
        { id: '1', title: 'React Hooks Tutorial', content: 'Learn React hooks' },
        { id: '2', title: 'React Basics', content: 'React fundamentals' },
        { id: '3', title: 'Vue Guide', content: 'Vue composition API' },
      ])

      const results = engine.search('react hooks')

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].item.title).toBe('React Hooks Tutorial')
    })

    it('should score items matching multiple terms higher', () => {
      engine.index([
        { id: '1', title: 'React', content: 'Just React' },
        { id: '2', title: 'React Hooks', content: 'React hooks guide' },
        { id: '3', title: 'React Hooks Advanced', content: 'Advanced React hooks patterns' },
      ])

      const results = engine.search('react hooks')

      expect(results[0].score).toBeGreaterThanOrEqual(results[1]?.score || 0)
    })
  })

  describe('case insensitive search', () => {
    it('should match regardless of case', () => {
      engine.index([
        { id: '1', title: 'REACT Tutorial', content: 'Learn React' },
        { id: '2', title: 'react guide', content: 'REACT patterns' },
      ])

      const results = engine.search('React')

      expect(results).toHaveLength(2)
    })
  })

  describe('scoring', () => {
    it('should score title matches higher than content', () => {
      engine.index([
        { id: '1', title: 'Tutorial', content: 'React is great' },
        { id: '2', title: 'React Guide', content: 'Just a guide' },
      ])

      const results = engine.search('react')

      expect(results[0].item.title).toBe('React Guide')
      expect(results[0].score).toBeGreaterThan(results[1]?.score || 0)
    })

    it('should score summary matches higher than content', () => {
      engine.index([
        { id: '1', title: 'Tutorial', content: 'Long content about React', summary: 'Short summary' },
        { id: '2', title: 'Guide', content: 'Long content', summary: 'React summary' },
      ])

      const results = engine.search('react')

      expect(results[0].item.id).toBe('2')
    })
  })

  describe('caching', () => {
    it('should cache search results', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      engine.search('react')
      engine.search('react')

      expect(engine.getCacheSize()).toBe(1)
    })

    it('should return cached results', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      const results1 = engine.search('react')
      const results2 = engine.search('react')

      expect(results1).toEqual(results2)
    })

    it('should clear cache when reindexing', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      engine.search('react')
      engine.index([
        { id: '2', title: 'Vue Tutorial', content: 'Learn Vue' },
      ])

      expect(engine.getCacheSize()).toBe(0)
    })

    it('should clear cache manually', () => {
      engine.index([
        { id: '1', title: 'React Tutorial', content: 'Learn React' },
      ])

      engine.search('react')
      engine.clearCache()

      expect(engine.getCacheSize()).toBe(0)
    })
  })

  describe('performance', () => {
    it('should handle 1000 items efficiently', () => {
      const items: SearchableItem[] = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        title: `Article ${i}`,
        content: `Content for article ${i} with some keywords`,
      }))

      engine.index(items)

      const start = performance.now()
      const results = engine.search('article 500')
      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
      expect(results.length).toBeGreaterThan(0)
    })
  })
})
