"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import ReceiptView, { Order } from "@/components/payments/ReceiptView";

// Define the types
type Payment = {
  id: number;
  orderId: number;
  paymentMethod: string;
  amount: string;
  tipAmount: string;
  totalAmount: string;
  status: string;
  reference: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: {
    serverName: string;
    serverId: number;
    paymentProcessor: string;
    amountPaid: string;
    change: string;
  };
};

// First, add the SplitPayment type definition before the Receipt type
type SplitPayment = {
  id: string;
  paymentMethod: string;
  amount: string;
  tipAmount: string;
};

type Receipt = {
  receiptNumber: string;
  orderId: number;
  orderAmount: string;
  tipAmount: string;
  totalAmount: string;
  amountPaid: string;
  change?: string;
  paymentMethod: string;
  paidAt: string;
  paymentStatus: string;
  server: string;
  splitPayment?: boolean;
  payments?: SplitPayment[];
  paymentMethods?: string[];
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [order, setOrder] = useState<Order | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<Receipt | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Filters
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Function to fetch payments
  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      let queryParams = `?page=${page}&limit=${pageSize}`;

      if (paymentMethod && paymentMethod !== "all") {
        queryParams += `&paymentMethod=${paymentMethod}`;
      }

      if (dateRange && dateRange !== "all") {
        queryParams += `&date=${dateRange}`;
      }

      if (searchTerm) {
        queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(`/api/payments${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch payments");
      }

      setPayments(data.payments || []);

      // Calculate total pages (in a real app, this would come from the API)
      setTotalPages(Math.ceil((data.total || payments.length) / pageSize));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, paymentMethod, dateRange, searchTerm, payments.length]);
  
  const fetchOrder = useCallback(async (id:string) => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      let queryParams = `${id}`;
      const response = await fetch(`/api/orders/${queryParams}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await response.json();

      
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch order");
      }

      
      console.log("Fetched order data:", data);
      setOrder(data.order || undefined);

      // Calculate total pages (in a real app, this would come from the API)
      setTotalPages(Math.ceil((data.total || payments.length) / pageSize));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, paymentMethod, dateRange, searchTerm, payments.length]);

  // Fetch payments on component mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle search
  const handleSearch = () => {
    setPage(1); // Reset to first page when searching
    fetchPayments();
  };

  // View receipt for a payment
  const viewReceipt = async (payment: Payment) => {
    try {
      // Create a receipt object from the payment data
      const receipt: Receipt = {
        receiptNumber: payment.reference,
        orderId: payment.orderId,
        orderAmount: payment.amount,
        tipAmount: payment.tipAmount || "0",
        totalAmount: payment.totalAmount,
        amountPaid: payment.metadata?.amountPaid || payment.totalAmount,
        change: payment.metadata?.change || "0",
        paymentMethod: payment.paymentMethod,
        paidAt: payment.createdAt,
        paymentStatus: payment.status,
        server: payment.metadata?.serverName || "Staff",
        splitPayment: false,
        payments: [], // Initialize as empty SplitPayment array
        paymentMethods: [payment.paymentMethod],
      };
      fetchOrder(payment.orderId.toString());
      console.log("Generated receipt:", receipt);
      setReceiptData(receipt);
      setShowReceipt(true);
    } catch (error) {
      console.error("Error loading receipt:", error);
      toast.error("Failed to load receipt");
    }
  };
const FetchOrder = async (orderId: number) => {


}
  // Get a friendly payment method display
  const getPaymentMethodDisplay = (method: string) => {
    switch (method) {
      case "cash":
        return "Cash";
      case "credit_card":
        return "Credit Card";
      case "debit_card":
        return "Debit Card";
      case "mobile_payment":
        return "Mobile Payment";
      case "gift_card":
        return "Gift Card";
      default:
        return method;
    }
  };

  return (
    <div className="container py-6 mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment History</h1>
      </div>

      <div className="flex flex-col gap-4 mb-6 md:flex-row">
        <div className="flex flex-1 gap-2">
          <Input
            placeholder="Search by reference or order ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="credit_card">Credit Card</SelectItem>
              <SelectItem value="debit_card">Debit Card</SelectItem>
              <SelectItem value="mobile_payment">Mobile Payment</SelectItem>
              <SelectItem value="gift_card">Gift Card</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="py-4 text-center">Loading payments...</p>}

      {error && (
        <div className="p-4 mb-6 border border-red-200 rounded bg-red-50">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchPayments} className="mt-2">
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && payments.length === 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">
              No payments found for the selected filters.
            </p>
          </CardContent>
        </Card>
      )}

      {payments.length > 0 && (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Reference #
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Date
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Order #
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Method
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Status
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Server
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-left">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{payment.reference}</td>
                    <td className="px-4 py-3 text-sm">
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">#{payment.orderId}</td>
                    <td className="px-4 py-3 text-sm">
                      {getPaymentMethodDisplay(payment.paymentMethod)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : payment.status === "refunded"
                            ? "bg-orange-100 text-orange-800"
                            : payment.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {formatCurrency(parseFloat(payment.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {payment.metadata?.serverName || "Staff"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewReceipt(payment)}
                        className="mr-2"
                      >
                        <Receipt className="w-4 h-4 mr-1" /> Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Receipt Dialog */}
      {showReceipt && receiptData && (
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptView
              receipt={receiptData}
              order={order}
              onClose={() => setShowReceipt(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
