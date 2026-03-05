import { useState, useEffect } from 'react'

// ============================================
// Hook: useReadingProgressIndicator
// ============================================

interface UseReadingProgressIndicatorReturn {
  progress: number
  isVisible: boolean
}

/**
 * 简单的阅读进度指示器 Hook
 * 用于显示顶部进度条
 */
export function useReadingProgressIndicator(): UseReadingProgressIndicatorReturn {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight

      if (scrollHeight > 0) {
        const percentage = Math.round((scrollTop / scrollHeight) * 100)
        setProgress(Math.min(100, Math.max(0, percentage)))
        setIsVisible(scrollTop > 50)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { progress, isVisible }
}

export default useReadingProgressIndicator
