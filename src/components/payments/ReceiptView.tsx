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
import { jsPDF } from "jspdf";
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

 function formatCurrency(value: number) {
  return "$" + value.toFixed(2);
}
function generateReceiptPDF(receipt: any, order?: any) {
  const doc = new jsPDF({
    unit: "mm",
    format: [100,200], // slightly bigger, for invoice style
  });

  let y = 15;
  const leftMargin = 8;
  const pageWidth = doc.internal.pageSize.getWidth();

  // Utility for drawing horizontal lines
  function drawLine(yPos: number) {
    doc.setDrawColor(150);
    doc.setLineWidth(0.3);
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
  }

  // Header - Restaurant Name + Address (you can customize)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("RESTAURANT POS SYSTEM", pageWidth / 2, y, { align: "center" });
  y += 7;

  drawLine(y);
  y += 5;

  // Receipt & Order Info (left aligned)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Receipt Info", leftMargin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.text(`Receipt #: ${receipt.receiptNumber.toString().padStart(8, "0")}`, leftMargin, y);
  y += 6;
  doc.text(`Date: ${new Date(receipt.paidAt).toLocaleString()}`, leftMargin, y);
  y += 6;
  doc.text(`Order #: ${receipt.orderId}`, leftMargin, y);
  y += 6;
  if (order) {
    doc.text(`Table: ${order.tableName}`, leftMargin, y);
    y += 6;
  }
  doc.text(`Server: ${receipt.server}`, leftMargin, y);
  y += 10;

  drawLine(y);
  y += 7;

  // Items Table Header
  doc.setFont("helvetica", "bold");
  doc.text("Qty", leftMargin, y);
  doc.text("Item", leftMargin + 20, y);
  doc.text("Price", pageWidth - 50, y, { align: "right" });
  doc.text("Total", pageWidth - 15, y, { align: "right" });
  y += 6;
  drawLine(y);
  y += 5;

  doc.setFont("helvetica", "normal");

  if (order && order.items.length > 0) {
    order.items.forEach((item: any) => {
      const qty = item.quantity.toString();
      const name = item.menuItemName;
      const price = parseFloat(item.price);
      const total = price * item.quantity;

      // Qty
      doc.text(qty, leftMargin, y);
      // Name (truncate if too long)
      const maxNameWidth = pageWidth - leftMargin - 80;
      let itemName = name;
      while (doc.getTextWidth(itemName) > maxNameWidth) {
        itemName = itemName.slice(0, -1);
      }
      doc.text(itemName, leftMargin + 20, y);
      // Price (per unit)
      doc.text(formatCurrency(price), pageWidth - 50, y, { align: "right" });
      // Total (price * qty)
      doc.text(formatCurrency(total), pageWidth - 15, y, { align: "right" });

      y += 6;

      if (item.notes) {
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Note: ${item.notes}`, leftMargin + 20, y);
        doc.setFontSize(11);
        doc.setTextColor(0);
        y += 5;
      }
    });
  } else {
    doc.text("No items found.", leftMargin + 20, y);
    y += 10;
  }

  drawLine(y);
  y += 8;

  // Totals on right side
  const totalsX = pageWidth - 15;
  doc.setFont("helvetica", "normal");

  doc.text("Subtotal:", totalsX - 75, y, { align: "left" });
  doc.text(formatCurrency(parseFloat(receipt.orderAmount)), totalsX, y, { align: "right" });
  y += 6;

  doc.text("Tip:", totalsX - 75, y, { align: "left" });
  doc.text(formatCurrency(parseFloat(receipt.tipAmount)), totalsX, y, { align: "right" });
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Total:", totalsX - 75, y, { align: "left" });
  doc.text(formatCurrency(parseFloat(receipt.totalAmount)), totalsX, y, { align: "right" });
  y += 10;

  // Payment Details
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", leftMargin, y);
  y += 7;

  doc.setFont("helvetica", "normal");

  if (receipt.splitPayment && receipt.payments?.length) {
    receipt.payments.forEach((p: any) => {
      doc.text(`${p.paymentMethod}:`, leftMargin, y);
      doc.text(formatCurrency(parseFloat(p.amount)), totalsX, y, { align: "right" });
      y += 6;
    });
  } else {
    doc.text(`${receipt.paymentMethod}:`, leftMargin, y);
    doc.text(formatCurrency(parseFloat(receipt.amountPaid)), totalsX, y, { align: "right" });
    y += 6;
  }

  if (receipt.change && parseFloat(receipt.change) > 0) {
    doc.setTextColor(0, 128, 0);
    doc.text("Change:", leftMargin, y);
    doc.text(formatCurrency(parseFloat(receipt.change)), totalsX, y, { align: "right" });
    doc.setTextColor(0);
    y += 8;
  }

  drawLine(y);
  y += 10;

  // Footer - Thank you message
  doc.setFontSize(12);
  doc.setFont("helvetica", "italic");
  doc.text("Thank you for your visit!", pageWidth / 2, y, { align: "center" });

  // Save PDF
  doc.save(`receipt-${receipt.receiptNumber}.pdf`);
}

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
    
generateReceiptPDF(receipt, order);

  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-xl">Receipt</CardTitle>
        <CardDescription>
          {formattedReceiptNumber} • {formattedDate}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h4 className="mb-2 text-sm font-medium">Order Details</h4>
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
            <h4 className="mb-2 text-sm font-medium">Items</h4>
            <div className="space-y-1 overflow-y-auto max-h-40">
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
                    <div className="ml-4 text-xs text-gray-500">
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
          <h4 className="text-sm font-medium">Payment</h4>
          <div className="space-y-1">
            {paymentMethods.map((method, index) => (
              <div key={index} className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{method}:</span>
                  <span>{formatCurrency(amountPaid)}</span>
                </div>
              </div>
            ))}

            {change > 0 && (
              <div className="flex justify-between text-sm font-medium text-green-600">
                <span>Change:</span>
                <span>{formatCurrency(change)}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="pt-4 mt-4 text-sm border-t">
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
      <CardFooter className="flex flex-wrap justify-between gap-2">
        <Button onClick={handlePrint} className="flex items-center">
          <Printer className="w-4 h-4 mr-2" /> Print Receipt
        </Button>
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex items-center"
        >
          <Download className="w-4 h-4 mr-2" /> Download
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
      <div className="pt-2 text-xs text-center text-muted-foreground">
        Thank you for your visit!
      </div>
    </Card>
  );
}
