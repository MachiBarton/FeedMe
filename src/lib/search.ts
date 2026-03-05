import Fuse from 'fuse.js'
import type { FeedItem, SearchResult } from './types'
import { getAllArticles } from './data-store'

// ============================================
// Search Configuration
// ============================================
const FUSE_OPTIONS: Fuse.IFuseOptions<SearchableArticle> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'content', weight: 0.35 },
    { name: 'contentSnippet', weight: 0.2 },
    { name: 'creator', weight: 0.05 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
}

// ============================================
// Types
// ============================================
interface SearchableArticle {
  id: string
  title: string
  content: string
  contentSnippet: string
  creator?: string
  sourceUrl: string
  sourceTitle: string
  link: string
  pubDate?: string
}

export interface SearchOptions {
  query: string
  filters?: {
    sourceUrl?: string
    dateFrom?: number
    dateTo?: number
  }
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  hasMore: boolean
  query: string
}

// ============================================
// Helper Functions
// ============================================

/**
 * Convert FeedItem to SearchableArticle
 */
function toSearchableArticle(
  item: FeedItem,
  sourceUrl: string,
  sourceTitle: string
): SearchableArticle {
  return {
    id: `${btoa(sourceUrl).replace(/[/+=]/g, '_')}:${btoa(item.link || '').replace(/[/+=]/g, '_')}`,
    title: item.title,
    content: item.content?.substring(0, 5000) || '',
    contentSnippet: item.contentSnippet || '',
    creator: item.creator,
    sourceUrl,
    sourceTitle,
    link: item.link || '',
    pubDate: item.pubDate || item.isoDate,
  }
}

/**
 * Convert SearchableArticle to SearchResult
 */
function toSearchResult(
  article: SearchableArticle,
  score: number,
  matches?: Fuse.FuseResultMatch[]
): SearchResult {
  // Determine match type based on matches
  let matchType: SearchResult['matchType'] = 'content'
  if (matches) {
    const matchedKeys = matches.map((m) => m.key)
    if (matchedKeys.includes('title')) {
      matchType = 'title'
    } else if (matchedKeys.includes('creator')) {
      matchType = 'author'
    }
  }

  return {
    articleId: article.id,
    title: article.title,
    link: article.link,
    sourceId: btoa(article.sourceUrl).replace(/[/+=]/g, '_'),
    sourceTitle: article.sourceTitle,
    pubDate: article.pubDate,
    contentSnippet: article.contentSnippet.substring(0, 200) + '...',
    matchType,
    relevanceScore: Math.round((1 - (score || 0)) * 100),
  }
}

/**
 * Build search index from all articles
 */
async function buildSearchIndex(): Promise<Fuse<SearchableArticle>> {
  // Get all articles
  const articles = await getAllArticles()

  // Convert to searchable articles
  const searchableArticles = articles.map((article) =>
    toSearchableArticle(article, article.sourceUrl, article.sourceTitle)
  )

  return new Fuse(searchableArticles, FUSE_OPTIONS)
}

// ============================================
// Main Search Functions
// ============================================

/**
 * Search articles
 */
export async function searchArticles(options: SearchOptions): Promise<SearchResponse> {
  const { query, filters, limit = 20, offset = 0 } = options

  // Normalize query
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
      query: normalizedQuery,
    }
  }

  // Build search index
  const fuse = await buildSearchIndex()

  // Perform search
  const searchResults = fuse.search(normalizedQuery)

  // Apply filters
  let filteredResults = searchResults
  if (filters) {
    filteredResults = searchResults.filter((result) => {
      const item = result.item

      if (filters.sourceUrl && item.sourceUrl !== filters.sourceUrl) {
        return false
      }

      if (filters.dateFrom || filters.dateTo) {
        const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : 0
        if (filters.dateFrom && pubDate < filters.dateFrom) {
          return false
        }
        if (filters.dateTo && pubDate > filters.dateTo) {
          return false
        }
      }

      return true
    })
  }

  // Convert to SearchResult format
  const allResults: SearchResult[] = filteredResults.map((result) =>
    toSearchResult(result.item, result.score || 0, result.matches)
  )

  // Apply pagination
  const paginatedResults = allResults.slice(offset, offset + limit)

  return {
    results: paginatedResults,
    totalCount: allResults.length,
    hasMore: offset + limit < allResults.length,
    query: normalizedQuery,
  }
}

/**
 * Quick search for suggestions (no caching)
 */
export async function quickSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return []
  }

  const fuse = await buildSearchIndex()
  const results = fuse.search(normalizedQuery, { limit })

  return results.map((result) =>
    toSearchResult(result.item, result.score || 0, result.matches)
  )
}

/**
 * Search by source
 */
export async function searchBySource(
  query: string,
  sourceUrl: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResponse> {
  return searchArticles({
    query,
    filters: { sourceUrl },
    limit,
    offset,
  })
}

// ============================================
// Advanced Search
// ============================================

export interface AdvancedSearchOptions extends SearchOptions {
  sortBy?: 'relevance' | 'date' | 'title'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Advanced search with sorting options
 */
export async function advancedSearch(
  options: AdvancedSearchOptions
): Promise<SearchResponse> {
  const { sortBy = 'relevance', sortOrder = 'desc' } = options

  const response = await searchArticles(options)

  // Sort results if needed
  if (sortBy !== 'relevance') {
    response.results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison =
            new Date(a.pubDate || 0).getTime() - new Date(b.pubDate || 0).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  return response
}
