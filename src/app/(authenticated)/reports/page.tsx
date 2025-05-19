"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown, Calendar, X } from "lucide-react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { formatCurrency } from "@/lib/utils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define types for our data
type MenuItem = {
  menuItemId: number;
  menuItemName: string;
  orderCount: number;
  totalRevenue: number;
};

type PaymentMethod = {
  paymentMethod: string;
  count: number;
  total: number;
};

type StaffMember = {
  serverId: number;
  serverName: string;
  orderCount: number;
  totalRevenue: number;
};

type TableStatus = {
  status: string;
  count: number;
};

type DateRange = {
  startDate: string;
  endDate: string;
};

type ReportsData = {
  filterType: string;
  period?: string;
  dateRange?: DateRange;
  salesOverview: {
    totalOrders: number;
    totalRevenue: number;
  };
  popularItems: MenuItem[];
  revenueByPaymentMethod: PaymentMethod[];
  staffPerformance: StaffMember[];
  tableOccupancy: TableStatus[];
};

export default function ReportsPage() {
  const [filterType, setFilterType] = useState<"period" | "dateRange">(
    "period"
  );
  const [period, setPeriod] = useState<string>("today");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);

  const fetchReportsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = "/api/reports";

      if (filterType === "period") {
        url = `${url}?period=${period}`;
      } else if (filterType === "dateRange" && startDate) {
        url = `${url}?startDate=${startDate.toISOString()}`;

        if (endDate) {
          url = `${url}&endDate=${endDate.toISOString()}`;
        }
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch reports data");
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching reports data:", err);
    } finally {
      setLoading(false);
    }
  }, [filterType, period, startDate, endDate]);

  useEffect(() => {
    fetchReportsData();
  }, [period, filterType, startDate, endDate, fetchReportsData]);

  // Switch to period-based filtering
  const switchToPeriodFilter = (newPeriod: string) => {
    setFilterType("period");
    setPeriod(newPeriod);
    setStartDate(null);
    setEndDate(null);
  };

  // Switch to date range filtering
  const applyDateRangeFilter = () => {
    if (startDate) {
      setFilterType("dateRange");
      setIsDatePickerOpen(false);
    }
  };

  // Clear date range filter
  const clearDateRangeFilter = () => {
    setFilterType("period");
    setStartDate(null);
    setEndDate(null);
    setPeriod("today");
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!startDate) return "";

    const formattedStart = format(startDate, "MMM d, yyyy");
    const formattedEnd = endDate ? format(endDate, "MMM d, yyyy") : "Present";

    return `${formattedStart} - ${formattedEnd}`;
  };

  // Chart configurations
  const popularItemsChartData = {
    labels: data?.popularItems.map((item) => item.menuItemName) || [],
    datasets: [
      {
        label: "Orders",
        data: data?.popularItems.map((item) => item.orderCount) || [],
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const revenueByPaymentMethodChartData = {
    labels:
      data?.revenueByPaymentMethod.map((method) => method.paymentMethod) || [],
    datasets: [
      {
        label: "Revenue",
        data: data?.revenueByPaymentMethod.map((method) => method.total) || [],
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const staffPerformanceChartData = {
    labels: data?.staffPerformance.map((staff) => staff.serverName) || [],
    datasets: [
      {
        label: "Orders",
        data: data?.staffPerformance.map((staff) => staff.orderCount) || [],
        backgroundColor: "rgba(153, 102, 255, 0.5)",
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="flex gap-2 items-center">
          {filterType === "period" ? (
            <>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>

              <Popover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    Custom Range <Calendar className="ml-2 h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-4" align="end">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <div className="grid gap-1">
                        <h4 className="font-medium">Start Date</h4>
                        <DatePicker
                          selected={startDate}
                          onChange={setStartDate}
                          selectsStart
                          startDate={startDate}
                          endDate={endDate}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select start date"
                        />
                      </div>
                      <div className="grid gap-1">
                        <h4 className="font-medium">End Date</h4>
                        <DatePicker
                          selected={endDate}
                          onChange={setEndDate}
                          selectsEnd
                          startDate={startDate}
                          endDate={endDate}
                          minDate={startDate}
                          className="w-full rounded-md border border-input bg-background px-3 py-2"
                          dateFormat="MMMM d, yyyy"
                          placeholderText="Select end date"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDatePickerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={applyDateRangeFilter}
                        disabled={!startDate}
                      >
                        Apply Range
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="bg-muted px-3 py-2 rounded-md text-sm flex items-center">
                <span>{formatDateRange()}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 ml-2"
                  onClick={clearDateRangeFilter}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsDatePickerOpen(true)}
              >
                Change Range
              </Button>
            </div>
          )}

          <Button variant="outline" size="icon">
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">
          <p>{error}</p>
          <Button variant="outline" onClick={fetchReportsData} className="mt-2">
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Orders</CardTitle>
                <CardDescription>
                  {filterType === "period"
                    ? period === "today"
                      ? "Today"
                      : period === "week"
                      ? "This Week"
                      : "This Month"
                    : "Custom Date Range"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data?.salesOverview.totalOrders || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>
                  {filterType === "period"
                    ? period === "today"
                      ? "Today"
                      : period === "week"
                      ? "This Week"
                      : "This Month"
                    : "Custom Date Range"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(data?.salesOverview.totalRevenue || 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Table Occupancy</CardTitle>
                <CardDescription>Current Status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {data?.tableOccupancy.find((t) => t.status === "occupied")
                    ?.count || 0}
                  <span className="text-sm text-muted-foreground ml-1">
                    /{" "}
                    {data?.tableOccupancy.reduce(
                      (acc, curr) => acc + curr.count,
                      0
                    ) || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports */}
          <Tabs defaultValue="sales">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="sales">Sales Overview</TabsTrigger>
              <TabsTrigger value="items">Popular Items</TabsTrigger>
              <TabsTrigger value="payment">Payment Methods</TabsTrigger>
              <TabsTrigger value="staff">Staff Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sales Overview</CardTitle>
                  <CardDescription>
                    Total orders and revenue for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {data && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">Orders Breakdown</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt>Total Orders:</dt>
                            <dd className="font-medium">
                              {data.salesOverview.totalOrders}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt>Average Order Value:</dt>
                            <dd className="font-medium">
                              {formatCurrency(
                                data.salesOverview.totalOrders > 0
                                  ? data.salesOverview.totalRevenue /
                                      data.salesOverview.totalOrders
                                  : 0
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">Revenue Breakdown</h3>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt>Gross Revenue:</dt>
                            <dd className="font-medium">
                              {formatCurrency(data.salesOverview.totalRevenue)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items">
              <Card>
                <CardHeader>
                  <CardTitle>Popular Items</CardTitle>
                  <CardDescription>
                    Most ordered menu items for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {data && data.popularItems.length > 0 ? (
                    <Bar
                      data={popularItemsChartData}
                      options={{ maintainAspectRatio: false }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    Revenue breakdown by payment method
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {data && data.revenueByPaymentMethod.length > 0 ? (
                    <Pie
                      data={revenueByPaymentMethodChartData}
                      options={{
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                          },
                        },
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance</CardTitle>
                  <CardDescription>
                    Order counts by server for the selected period
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  {data && data.staffPerformance.length > 0 ? (
                    <Bar
                      data={staffPerformanceChartData}
                      options={{
                        maintainAspectRatio: false,
                        indexAxis: "y", // Horizontal bar chart
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
