"use client"

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map()
    this.isProduction = process.env.NODE_ENV === "production"
  }

  // Start timing an operation
  startTiming(label) {
    if (typeof window !== "undefined" && window.performance) {
      this.metrics.set(label, {
        startTime: performance.now(),
        label,
      })
    }
  }

  // End timing and log results
  endTiming(label) {
    if (typeof window !== "undefined" && window.performance && this.metrics.has(label)) {
      const metric = this.metrics.get(label)
      const duration = performance.now() - metric.startTime

      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`)

      // Log slow operations in production
      if (this.isProduction && duration > 1000) {
        console.warn(`[Performance Warning] Slow operation: ${label} took ${duration.toFixed(2)}ms`)
      }

      this.metrics.delete(label)
      return duration
    }
    return 0
  }

  // Monitor API calls
  monitorApiCall(url, startTime) {
    if (typeof window !== "undefined" && window.performance) {
      const duration = performance.now() - startTime
      console.log(`[API Performance] ${url}: ${duration.toFixed(2)}ms`)

      if (this.isProduction && duration > 2000) {
        console.warn(`[API Warning] Slow API call: ${url} took ${duration.toFixed(2)}ms`)
      }

      return duration
    }
    return 0
  }

  // Monitor component render times
  monitorRender(componentName, renderFunction) {
    const startTime = performance.now()
    const result = renderFunction()
    const duration = performance.now() - startTime

    if (duration > 16) {
      // More than one frame at 60fps
      console.log(`[Render Performance] ${componentName}: ${duration.toFixed(2)}ms`)
    }

    return result
  }

  // Get Web Vitals
  getWebVitals() {
    if (typeof window !== "undefined" && "web-vital" in window) {
      // This would integrate with web-vitals library
      console.log("[Performance] Web Vitals monitoring active")
    }
  }
}

export const performanceMonitor = new PerformanceMonitor()
