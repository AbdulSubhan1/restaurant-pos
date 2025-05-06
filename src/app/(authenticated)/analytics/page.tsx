"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart, Clock, AlertTriangle } from "lucide-react";

// Define types for our API responses
interface PageViewData {
  path: string;
  count: number;
  lastViewed: string;
}

interface PageViewResponse {
  success: boolean;
  pageViews: Record<string, PageViewData>;
}

interface EventItem {
  category: string;
  count: number;
}

interface EventResponse {
  success: boolean;
  eventCounts: Record<string, number>;
  recentEvents: Array<{
    event: string;
    properties: Record<string, any>;
    timestamp: string;
  }>;
}

interface PerformanceItem {
  url: string;
  averageLoadTime: number;
  sampleCount: number;
}

interface PerformanceResponse {
  success: boolean;
  recentTimings: Array<{
    pageLoadTime: number;
    url: string;
    timeToFirstByte: number;
    domContentLoaded: number;
    timestamp: string;
  }>;
  averages: PerformanceItem[];
}

interface ErrorItem {
  message: string;
  count: number;
}

interface ErrorResponse {
  success: boolean;
  recentErrors: Array<{
    message: string;
    stack?: string;
    url?: string;
    context?: Record<string, any>;
    timestamp: string;
  }>;
  mostCommonErrors: ErrorItem[];
  totalErrors: number;
}

export default function AnalyticsDashboard() {
  const [pageViewData, setPageViewData] = useState<PageViewResponse | null>(
    null
  );
  const [eventData, setEventData] = useState<EventResponse | null>(null);
  const [performanceData, setPerformanceData] =
    useState<PerformanceResponse | null>(null);
  const [errorData, setErrorData] = useState<ErrorResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalyticsData() {
      try {
        setLoading(true);

        // Fetch all analytics data in parallel
        const [
          pageViewResponse,
          eventResponse,
          performanceResponse,
          errorResponse,
        ] = await Promise.all([
          fetch("/api/analytics/pageview"),
          fetch("/api/analytics/event"),
          fetch("/api/performance/timing"),
          fetch("/api/performance/error"),
        ]);

        const pageViewResult = await pageViewResponse.json();
        const eventResult = await eventResponse.json();
        const performanceResult = await performanceResponse.json();
        const errorResult = await errorResponse.json();

        setPageViewData(pageViewResult as PageViewResponse);
        setEventData(eventResult as EventResponse);
        setPerformanceData(performanceResult as PerformanceResponse);
        setErrorData(errorResult as ErrorResponse);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading analytics data...</p>
      </div>
    );
  }

  // Find most viewed categories from event data
  const categoryViewCounts: EventItem[] = eventData?.eventCounts
    ? Object.entries(eventData.eventCounts)
        .filter(([key]) => key.startsWith("category_"))
        .map(([key, count]) => ({
          category: key.replace("category_", ""),
          count: count as number,
        }))
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <div className="container py-6 space-y-6">
      <div>
        <Heading
          title="Menu Analytics Dashboard"
          description="View analytics and performance data for your public menu"
        />
        <Separator className="my-4" />
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full md:w-auto grid-cols-4 h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Menu Page Views
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pageViewData?.pageViews?.["/menu"]?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Since tracking began
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Most Viewed Category
                </CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {categoryViewCounts[0]?.category || "None"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {categoryViewCounts[0]?.count || 0} views
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Page Load Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData?.averages?.find((a) => a.url === "/menu")
                    ?.averageLoadTime || 0}
                  ms
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on{" "}
                  {performanceData?.averages?.find((a) => a.url === "/menu")
                    ?.sampleCount || 0}{" "}
                  samples
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Popularity</CardTitle>
              <CardDescription>
                Which menu categories are viewed most often
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoryViewCounts.length > 0 ? (
                <div className="space-y-4">
                  {categoryViewCounts.map((item) => (
                    <div
                      key={item.category}
                      className="flex items-center justify-between"
                    >
                      <div className="font-medium">{item.category}</div>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-secondary rounded overflow-hidden mr-2">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(
                                100,
                                (item.count /
                                  (categoryViewCounts[0]?.count || 1)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {item.count} views
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No category data available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                Page load times and other performance data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {performanceData?.recentTimings &&
              performanceData.recentTimings.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">
                      Average Load Times by Page
                    </h3>
                    <div className="space-y-2">
                      {performanceData.averages &&
                        performanceData.averages.map((item) => (
                          <div
                            key={item.url}
                            className="flex items-center justify-between"
                          >
                            <div className="font-medium">{item.url}</div>
                            <div>
                              {item.averageLoadTime}ms ({item.sampleCount}{" "}
                              samples)
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Recent Load Times</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {performanceData.recentTimings
                        .slice(0, 10)
                        .map((item, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium">{item.url}</span>:{" "}
                            {item.pageLoadTime}ms
                            <span className="text-muted-foreground">
                              {" "}
                              ({new Date(item.timestamp).toLocaleString()})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No performance data available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Error Tracking</CardTitle>
              <CardDescription>
                View errors reported from the menu page
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorData?.recentErrors && errorData.recentErrors.length > 0 ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">Most Common Errors</h3>
                    <div className="space-y-2">
                      {errorData.mostCommonErrors &&
                        errorData.mostCommonErrors.map((item, index) => (
                          <div key={index} className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
                            <span className="font-medium">{item.message}</span>
                            <span className="ml-2 text-muted-foreground">
                              ({item.count} occurrences)
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Recent Errors</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {errorData.recentErrors
                        .slice(0, 5)
                        .map((error, index) => (
                          <div
                            key={index}
                            className="text-sm p-3 bg-muted rounded-md"
                          >
                            <div className="font-medium text-destructive mb-1">
                              {error.message}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(error.timestamp).toLocaleString()}
                            </div>
                            {error.url && (
                              <div className="text-muted-foreground">
                                URL: {error.url}
                              </div>
                            )}
                            {error.stack && (
                              <pre className="mt-2 text-xs bg-background p-2 rounded overflow-x-auto">
                                {error.stack.split("\n").slice(0, 3).join("\n")}
                              </pre>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="text-muted-foreground">
                    No errors reported yet. That's good!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
