// Performance monitoring utilities

// Track page load time using the Web Performance API
export function trackPageLoadTime() {
  if (typeof window !== "undefined" && "performance" in window) {
    // Wait for the page to fully load
    window.addEventListener("load", () => {
      // Get navigation timing data
      const perfData = window.performance.timing;

      // Calculate page load time (from navigation start to load event)
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      console.log(`[Performance] Page load time: ${pageLoadTime}ms`);

      // Report to backend
      try {
        fetch("/api/performance/timing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pageLoadTime,
            url: window.location.pathname,
            // Include other metrics you might want to track
            timeToFirstByte: perfData.responseStart - perfData.navigationStart,
            domContentLoaded:
              perfData.domContentLoadedEventEnd - perfData.navigationStart,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error("[Performance] Failed to report load time", error);
      }
    });
  }
}

// Track web vitals (optional, more advanced)
export function trackWebVitals() {
  if (typeof window !== "undefined") {
    // This would use a library like 'web-vitals' to track Core Web Vitals
    // import { getCLS, getFID, getLCP } from 'web-vitals';
    // getCLS(metric => reportMetric('CLS', metric.value));
    // getFID(metric => reportMetric('FID', metric.value));
    // getLCP(metric => reportMetric('LCP', metric.value));
  }
}

// Report an error to the backend
export function reportError(error: Error, context?: Record<string, any>) {
  console.error("[Error]", error, context);

  // Report to backend
  if (typeof window !== "undefined") {
    // Client-side error reporting
    try {
      fetch("/api/performance/error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (e) {
      // If the error reporting fails, log to console
      console.error("[Error Reporting] Failed to report error", e);
    }
  }
  // Server-side error reporting is handled by API routes directly
}

// Set up global error handlers
export function setupErrorTracking() {
  if (typeof window !== "undefined") {
    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      reportError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        reason: event.reason,
      });
    });

    // Track uncaught errors
    window.addEventListener("error", (event) => {
      reportError(new Error(`Uncaught Error: ${event.message}`), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }
}
