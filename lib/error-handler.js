"use client"

class ErrorHandler {
  constructor() {
    this.isProduction = process.env.NODE_ENV === "production"
    this.setupGlobalErrorHandling()
  }

  setupGlobalErrorHandling() {
    if (typeof window !== "undefined") {
      // Handle unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        console.error("[v0] Unhandled promise rejection:", event.reason)
        this.logError("UnhandledPromiseRejection", event.reason)

        // Prevent the default browser behavior
        event.preventDefault()
      })

      // Handle JavaScript errors
      window.addEventListener("error", (event) => {
        console.error("[v0] JavaScript error:", event.error)
        this.logError("JavaScriptError", event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
      })
    }
  }

  logError(type, error, context = {}) {
    const errorInfo = {
      type,
      message: error?.message || error?.toString() || "Unknown error",
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "unknown",
      userAgent: typeof window !== "undefined" ? navigator.userAgent : "unknown",
      ...context,
    }

    if (this.isProduction) {
      // In production, send to error monitoring service
      this.sendToMonitoringService(errorInfo)
    } else {
      // In development, log to console
      console.error("[Error Handler]", errorInfo)
    }
  }

  sendToMonitoringService(errorInfo) {
    // Integrate with error monitoring services like Sentry, LogRocket, etc.
    try {
      // Example: Send to your monitoring endpoint
      fetch("/api/errors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(errorInfo),
      }).catch((err) => {
        console.error("Failed to send error to monitoring service:", err)
      })
    } catch (err) {
      console.error("Error in error handler:", err)
    }
  }

  // Handle API errors specifically
  handleApiError(error, context = {}) {
    const apiError = {
      type: "APIError",
      message: error.message,
      status: error.status,
      endpoint: context.endpoint,
      method: context.method,
      timestamp: new Date().toISOString(),
    }

    this.logError("APIError", apiError, context)

    // Return user-friendly error message
    if (error.status >= 500) {
      return "Server error. Please try again later."
    } else if (error.status === 404) {
      return "Resource not found."
    } else if (error.status === 403) {
      return "Access denied."
    } else if (error.status === 401) {
      return "Authentication required."
    } else {
      return error.message || "An error occurred."
    }
  }

  // Handle database errors
  handleDatabaseError(error, operation = "database operation") {
    console.error(`[Database Error] ${operation}:`, error)

    this.logError("DatabaseError", error, { operation })

    if (this.isProduction) {
      return "Database error. Please try again."
    } else {
      return `Database error in ${operation}: ${error.message}`
    }
  }
}

export const errorHandler = new ErrorHandler()
