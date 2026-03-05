import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import { RssFeed } from '../rss-feed'
import * as dataStore from '@/lib/data-store'
import type { FeedData } from '@/lib/types'

// Mock the data-store module
vi.mock('@/lib/data-store', () => ({
  loadFeedData: vi.fn(),
}))

// Mock the navigation hook
vi.mock('@/hooks/use-navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Mock the config
vi.mock('@/config/rss-config', () => ({
  findSourceByUrl: vi.fn(() => ({ name: 'Test Source', category: 'Tech' })),
  defaultSource: { url: 'https://example.com/rss', name: 'Default', category: 'General' },
}))

describe('RssFeed', () => {
  const mockFeedData: FeedData = {
    sourceUrl: 'https://example.com/rss',
    title: 'Test Feed',
    description: 'A test feed',
    link: 'https://example.com',
    items: [
      {
        title: 'Article 1',
        link: 'https://example.com/1',
        pubDate: '2024-01-01T00:00:00Z',
        content: '<p>Content 1</p>',
        summary: 'Summary 1',
      },
      {
        title: 'Article 2',
        link: 'https://example.com/2',
        pubDate: '2024-01-02T00:00:00Z',
        content: '<p>Content 2</p>',
        summary: 'Summary 2',
      },
    ],
    lastUpdated: '2024-01-03T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show loading state initially', () => {
    vi.mocked(dataStore.loadFeedData).mockImplementation(() => new Promise(() => {}))

    render(<RssFeed defaultSource="https://example.com/rss" />)

    // Loading skeleton should be present
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should display feed data when loaded', async () => {
    vi.mocked(dataStore.loadFeedData).mockResolvedValue(mockFeedData)

    render(<RssFeed defaultSource="https://example.com/rss" />)

    await waitFor(() => {
      expect(screen.getByText('Article 1')).toBeInTheDocument()
    })

    expect(screen.getByText('Article 2')).toBeInTheDocument()
  })

  it('should display error when feed fails to load', async () => {
    vi.mocked(dataStore.loadFeedData).mockResolvedValue(null)

    render(<RssFeed defaultSource="https://example.com/rss" />)

    await waitFor(() => {
      expect(screen.getByText(/数据为空/)).toBeInTheDocument()
    })
  })

  it('should display last updated time', async () => {
    vi.mocked(dataStore.loadFeedData).mockResolvedValue(mockFeedData)

    render(<RssFeed defaultSource="https://example.com/rss" />)

    await waitFor(() => {
      expect(screen.getByText(/更新于:/)).toBeInTheDocument()
    })
  })

  it('should render article with tabs for summary and original content', async () => {
    vi.mocked(dataStore.loadFeedData).mockResolvedValue(mockFeedData)

    render(<RssFeed defaultSource="https://example.com/rss" />)

    await waitFor(() => {
      // Use getAllByText since there are multiple tabs (one per article)
      const aiTabs = screen.getAllByText('AI 摘要')
      expect(aiTabs.length).toBeGreaterThan(0)
      const originalTabs = screen.getAllByText('原文内容')
      expect(originalTabs.length).toBeGreaterThan(0)
    })
  })
})
