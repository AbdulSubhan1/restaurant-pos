"use client";

import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
// Define the types
type OrderItem = {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  price: string;
  status: string;
  notes: string | null;
  createdAt: string;
};

type Order = {
  id: number;
  tableId: number;
  tableName: string;
  serverId: number;
  serverName: string;
  status: string;
  totalAmount: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  items: OrderItem[];
};

type PaymentMethod = {
  method: string;
  amount: string;
  tipAmount: string;
};

type SplitPayment = {
  id: string;
  paymentMethod: string;
  amount: string;
  tipAmount: string;
};

type Receipt = {
  receiptNumber: string;
  orderId: number;
  date: string;
  cashier: string;
  payments: PaymentMethod[];
  subtotal: string;
  tipTotal: string;
  total: string;
  change: string;
};

interface ReceiptViewProps {
  receipt: {
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
  order?: Order;
  onPrint?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
}

export default function ReceiptView({
  receipt,
  order,
  onPrint,
  onDownload,
  onClose,
}: ReceiptViewProps) {
  // Format the receipt number with leading zeros
 const receiptNumberStr = receipt.receiptNumber?.toString() ?? "";
const formattedReceiptNumber = `#${receiptNumberStr.padStart(8, "0")}`;

  // Format the current date
  const today = new Date();
  const formattedDate = formatDate(today.toISOString());

  // In the content section, update to use the correct receipt properties

  // For the payment summary section:
  const subtotal = parseFloat(receipt.orderAmount);
  const tipTotal = parseFloat(receipt.tipAmount);
  const total = parseFloat(receipt.totalAmount);

  // For the payment methods section:
  const paymentMethods = receipt.splitPayment
    ? receipt.paymentMethods || []
    : [receipt.paymentMethod];

  // For the payment details:
  const amountPaid = parseFloat(receipt.amountPaid);
  const change = receipt.change ? parseFloat(receipt.change) : 0;

  // For the server name:
  const serverName = receipt.server;

  // Generate the receipt for print/download
  const generateReceiptText = () => {
    let text = "";
    text += "RESTAURANT POS SYSTEM\n";
    text += "----------------------\n\n";
    text += `Receipt: ${formattedReceiptNumber}\n`;
    text += `Date: ${formattedDate}\n`;
    text += `Order #: ${receipt.orderId}\n`;

    if (order) {
      text += `Table: ${order.tableName}\n`;
    }

    text += `Server: ${serverName}\n`;
    text += `\n`;

    if (order) {
      text += "ITEMS\n";
      text += "-----\n";
      order.items.forEach((item) => {
        text += `${item.quantity}x ${item.menuItemName}\n`;
        text += `  ${formatCurrency(parseFloat(item.price) * item.quantity)}\n`;
        if (item.notes) {
          text += `  Note: ${item.notes}\n`;
        }
      });
    }

    text += "\n";
    text += `Subtotal: ${formatCurrency(subtotal)}\n`;
    text += `Tip: ${formatCurrency(tipTotal)}\n`;
    text += `Total: ${formatCurrency(total)}\n\n`;

    text += "PAYMENT\n";
    text += "-------\n";
    paymentMethods.forEach((method) => {
      text += `${method}: ${formatCurrency(amountPaid)}\n`;
    });

    if (change > 0) {
      text += `Change: ${formatCurrency(change)}\n`;
    }

    text += "\n\n";
    text += "Thank you for your visit!\n";

    return text;
  };

  // Handle printing the receipt
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    let text = "RECEIPT\n";
    text += "=======\n\n";
    text += `Receipt #: ${receipt.receiptNumber}\n`;
    text += `Date: ${formatDate(receipt.paidAt)}\n`;
    text += `Order #: ${receipt.orderId}\n`;

    if (order) {
      text += `Table: ${order.tableName}\n`;
    }

    text += `Server: ${serverName}\n`;
    text += `\n`;

    if (order) {
      text += "ITEMS\n";
      text += "-----\n";
      order.items.forEach((item) => {
        text += `${item.quantity}x ${item.menuItemName}\n`;
        text += `  ${formatCurrency(parseFloat(item.price) * item.quantity)}\n`;
        if (item.notes) {
          text += `  Note: ${item.notes}\n`;
        }
      });
    }

    // Create a hidden element with the receipt content
    const element = document.createElement("div");
    element.style.display = "none";
    element.innerHTML = `<pre>${text}</pre>`;
    document.body.appendChild(element);

    // Print the element
    window.print();

    // Remove the element after printing
    document.body.removeChild(element);
  };

  // Handle downloading the receipt
 const handleDownload = () => {
  if (onDownload) {
    onDownload();
    return;
  }

  const text = generateReceiptText();

  const doc = new jsPDF();
  const margin = 10;
  const lineHeight = 7;
  const maxLineWidth = 180; // 210mm (A4 width) - margins

  // Split text into lines that fit the page
  const lines = doc.splitTextToSize(text, maxLineWidth);
  lines.forEach((line:any, i:any) => {
    doc.text(line, margin, margin + lineHeight * (i + 1));
  });

  doc.save(`receipt-${receipt.receiptNumber}.pdf`);
};

  return (
    <Card className="w-full">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">Receipt</CardTitle>
        <CardDescription>
          {formattedReceiptNumber} • {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="font-medium text-sm mb-2">Order Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Receipt #:</span>
              <span>{receipt.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Order #:</span>
              <span>{receipt.orderId}</span>
            </div>
            {order && (
              <div className="flex justify-between">
                <span>Table:</span>
                <span>{order.tableName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Server:</span>
              <span>{serverName}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDate(receipt.paidAt)}</span>
            </div>
          </div>
        </div>

        {order && (
          <div>
            <h4 className="font-medium text-sm mb-2">Items</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {order.items.map((item) => (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between">
                    <span>
                      {item.quantity}x {item.menuItemName}
                    </span>
                    <span>
                      {formatCurrency(parseFloat(item.price) * item.quantity)}
                    </span>
                  </div>
                  {item.notes && (
                    <div className="text-xs text-gray-500 ml-4">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Order Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tip:</span>
            <span>{formatCurrency(tipTotal)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <Separator />

        {/* Payment Methods */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Payment</h4>
          <div className="space-y-1">
            {paymentMethods.map((method, index) => (
              <div key={index} className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{method}:</span>
                  <span>{formatCurrency(amountPaid)}</span>
                </div>
              </div>
            ))}

            {change > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Change:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="text-sm border-t pt-4 mt-4">
          <div className="flex justify-between">
            <span>Reference #:</span>
            <span>{receipt.receiptNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(receipt.paidAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{serverName}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button onClick={handlePrint} className="flex items-center">
          <Printer className="mr-2 h-4 w-4" /> Print Receipt
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex items-center"
        >
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
        {onClose && (
          <Button
            onClick={onClose}
            variant="secondary"
            className="flex items-center"
          >
            Close
          </Button>
        )}
      </CardFooter>
      <div className="text-center text-xs text-muted-foreground pt-2">
        Thank you for your visit!
      </div>
    </Card>
  );
}
