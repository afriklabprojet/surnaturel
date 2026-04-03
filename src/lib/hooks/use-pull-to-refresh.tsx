"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  /** Minimum pull distance in pixels to trigger refresh (default: 80) */
  threshold?: number
  /** Disable the hook (e.g. on desktop) */
  disabled?: boolean
}

/**
 * Pull-to-refresh hook for mobile list pages.
 *
 * Usage:
 *   const { containerRef, pullDistance, refreshing } = usePullToRefresh({
 *     onRefresh: async () => { await loadData() },
 *   })
 *
 *   return (
 *     <div ref={containerRef}>
 *       {pullDistance > 0 && <PullIndicator distance={pullDistance} refreshing={refreshing} />}
 *       {children}
 *     </div>
 *   )
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const pulling = useRef(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || refreshing) return
    // Only start pull if scrolled to top
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    if (scrollTop > 5) return

    touchStartY.current = e.touches[0].clientY
    pulling.current = true
  }, [disabled, refreshing])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling.current || disabled || refreshing) return

    const currentY = e.touches[0].clientY
    const diff = currentY - touchStartY.current

    if (diff > 0) {
      // Apply resistance: pull distance is sqrt-dampened
      const dampened = Math.min(Math.sqrt(diff) * 4, 150)
      setPullDistance(dampened)
    }
  }, [disabled, refreshing])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || disabled) return
    pulling.current = false

    if (pullDistance >= threshold && !refreshing) {
      setRefreshing(true)
      setPullDistance(threshold) // Lock at threshold while refreshing
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        setPullDistance(0)
      }
    } else {
      setPullDistance(0)
    }
  }, [pullDistance, threshold, refreshing, onRefresh, disabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    container.addEventListener("touchstart", handleTouchStart, { passive: true })
    container.addEventListener("touchmove", handleTouchMove, { passive: true })
    container.addEventListener("touchend", handleTouchEnd)

    return () => {
      container.removeEventListener("touchstart", handleTouchStart)
      container.removeEventListener("touchmove", handleTouchMove)
      container.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, disabled])

  return { containerRef, pullDistance, refreshing }
}

/**
 * Visual indicator component for pull-to-refresh.
 */
export function PullIndicator({
  distance,
  refreshing,
  threshold = 80,
}: {
  distance: number
  refreshing: boolean
  threshold?: number
}) {
  const progress = Math.min(distance / threshold, 1)
  const opacity = Math.min(progress * 1.5, 1)

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-[height] duration-150"
      style={{ height: `${distance}px`, opacity }}
    >
      <div
        className={`h-6 w-6 rounded-full border-2 border-primary-brand border-t-transparent ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{
          transform: refreshing ? undefined : `rotate(${progress * 360}deg)`,
        }}
      />
    </div>
  )
}
