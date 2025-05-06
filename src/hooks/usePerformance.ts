import { useEffect, useState } from "react";
import {
  trackPageLoadTime,
  setupErrorTracking,
  reportError,
} from "@/lib/performance";

export function usePerformanceMonitoring() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      // Set up performance monitoring
      trackPageLoadTime();
      setupErrorTracking();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Return a function to manually report errors
  return {
    reportError,
  };
}

// Optional: A hook for component-level render timing
export function useComponentRenderTiming(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Only log render times above a threshold to reduce noise
      if (renderTime > 50) {
        console.log(
          `[Performance] Component ${componentName} render time: ${renderTime.toFixed(
            2
          )}ms`
        );

        // You could also report this to your backend for analysis
        try {
          fetch("/api/performance/component", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              componentName,
              renderTime,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (error) {
          // Silently fail
        }
      }
    };
  }, [componentName]);
}
