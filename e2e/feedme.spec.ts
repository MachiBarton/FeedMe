import { test, expect, Page } from '@playwright/test'

/**
 * E2E Test Suite for FeedMe
 *
 * Tests cover:
 * - Basic page load and rendering
 * - Theme switching
 * - Source switching
 * - Article interactions
 * - Responsive design
 */

test.describe('FeedMe E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173')
    // Wait for the app to load
    await page.waitForSelector('text=FeedMe')
  })

  test.describe('Page Load', () => {
    test('should display the app title', async ({ page }) => {
      await expect(page.locator('text=FeedMe')).toBeVisible()
    })

    test('should display the source switcher', async ({ page }) => {
      await expect(page.locator('[data-testid="source-switcher"]')).toBeVisible()
    })

    test('should display articles after loading', async ({ page }) => {
      // Wait for articles to load
      await page.waitForSelector('.feed-card', { timeout: 10000 })
      const articles = page.locator('.feed-card')
      await expect(articles.first()).toBeVisible()
    })

    test('should display footer', async ({ page }) => {
      await expect(page.locator('text=Stay hungry')).toBeVisible()
    })
  })

  test.describe('Theme Switching', () => {
    test('should toggle between light and dark mode', async ({ page }) => {
      // Find theme toggle button
      const themeToggle = page.locator('[data-testid="theme-toggle"]')
      await expect(themeToggle).toBeVisible()

      // Get initial theme
      const initialTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'))

      // Click to toggle
      await themeToggle.click()

      // Wait for theme to change
      await page.waitForTimeout(300)

      // Check theme changed
      const newTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'))
      expect(newTheme).not.toBe(initialTheme)
    })
  })

  test.describe('Source Switching', () => {
    test('should switch between sources', async ({ page }) => {
      // Open source switcher
      const sourceSwitcher = page.locator('[data-testid="source-switcher"]')
      await sourceSwitcher.click()

      // Select a different source (if available)
      const sourceOptions = page.locator('[data-testid="source-option"]')
      if (await sourceOptions.count() > 1) {
        await sourceOptions.nth(1).click()

        // Wait for articles to reload
        await page.waitForTimeout(2000)

        // Check that articles are displayed
        const articles = page.locator('.feed-card')
        await expect(articles.first()).toBeVisible()
      }
    })
  })

  test.describe('Article Interactions', () => {
    test('should display article tabs', async ({ page }) => {
      await page.waitForSelector('.feed-card', { timeout: 10000 })

      // Check for tabs
      await expect(page.locator('text=AI 摘要').first()).toBeVisible()
      await expect(page.locator('text=原文内容').first()).toBeVisible()
    })

    test('should switch between summary and original content tabs', async ({ page }) => {
      await page.waitForSelector('.feed-card', { timeout: 10000 })

      // Click on original content tab
      const originalTab = page.locator('text=原文内容').first()
      await originalTab.click()

      // Verify tab is active
      await expect(originalTab).toHaveAttribute('data-state', 'active')
    })

    test('should open article links in new tab', async ({ page, context }) => {
      await page.waitForSelector('.feed-card', { timeout: 10000 })

      // Get the first article link
      const articleLink = page.locator('.feed-card a[target="_blank"]').first()

      // Check link has proper attributes
      await expect(articleLink).toHaveAttribute('target', '_blank')
      await expect(articleLink).toHaveAttribute('rel', 'noopener noreferrer')
    })
  })

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Wait for layout to adjust
      await page.waitForTimeout(500)

      // Check that content is still visible
      await expect(page.locator('text=FeedMe')).toBeVisible()
    })

    test('should adapt to tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      // Wait for layout to adjust
      await page.waitForTimeout(500)

      // Check that content is still visible
      await expect(page.locator('text=FeedMe')).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading structure', async ({ page }) => {
      // Check for h1
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
    })

    test('should have accessible theme toggle', async ({ page }) => {
      const themeToggle = page.locator('[data-testid="theme-toggle"]')
      await expect(themeToggle).toHaveAttribute('aria-label')
    })
  })
})
