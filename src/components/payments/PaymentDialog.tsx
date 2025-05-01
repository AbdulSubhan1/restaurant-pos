"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAYMENT_METHODS } from "@/db/schema/payments";
import {
  CreditCard,
  Receipt,
  DollarSign,
  Smartphone,
  GiftIcon,
  Plus,
  Trash2,
} from "lucide-react";
import ReceiptView from "./ReceiptView";

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

type SplitPayment = {
  id: string;
  paymentMethod: string;
  amount: string;
  tipAmount: string;
};

interface PaymentDialogProps {
  order: Order;
  onClose: () => void;
  onPaymentComplete: (receipt: any) => void;
}

export default function PaymentDialog({
  order,
  onClose,
  onPaymentComplete,
}: PaymentDialogProps) {
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<string>(
    PAYMENT_METHODS.CASH
  );
  const [tipAmount, setTipAmount] = useState<string>("0");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // Split payment state
  const [useSplitPayment, setUseSplitPayment] = useState<boolean>(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([
    {
      id: "split-1",
      paymentMethod: PAYMENT_METHODS.CASH,
      amount: "",
      tipAmount: "0",
    },
  ]);

  // Tip presets
  const tipPresets = [0, 5, 10, 15, 20];

  // Calculate order details
  const orderTotal = parseFloat(order.totalAmount);
  const tipValue = parseFloat(tipAmount || "0");
  const finalTotal = orderTotal + tipValue;

  // Show quick amounts for cash payments
  const quickAmounts = [
    Math.ceil(finalTotal),
    Math.ceil(finalTotal / 5) * 5,
    Math.ceil(finalTotal / 10) * 10,
    Math.ceil(finalTotal / 20) * 20,
  ];

  // Apply a percentage tip
  const applyTipPercentage = (percentage: number) => {
    const tipValue = (orderTotal * percentage) / 100;
    setTipAmount(tipValue.toFixed(2));
  };

  // Reset the payment form
  const resetForm = () => {
    setPaymentMethod(PAYMENT_METHODS.CASH);
    setTipAmount("0");
    setAmountTendered("");
    setNotes("");
    setReceiptData(null);
    setUseSplitPayment(false);
    setSplitPayments([
      {
        id: "split-1",
        paymentMethod: PAYMENT_METHODS.CASH,
        amount: "",
        tipAmount: "0",
      },
    ]);
  };

  // Handle full payment
  const handlePayment = async () => {
    setLoading(true);

    try {
      // For split payments
      if (useSplitPayment) {
        // Validate all split payments have amounts
        const invalidPayments = splitPayments.some(
          (payment) => !payment.amount || parseFloat(payment.amount) <= 0
        );

        if (invalidPayments) {
          toast.error("All split payments must have valid amounts");
          setLoading(false);
          return;
        }

        // Calculate total from split payments
        const totalPaid = splitPayments.reduce(
          (sum, payment) => sum + parseFloat(payment.amount || "0"),
          0
        );

        // Calculate total tips
        const totalTips = splitPayments.reduce(
          (sum, payment) => sum + parseFloat(payment.tipAmount || "0"),
          0
        );

        // Calculate final total with tips
        const finalTotalWithTips = orderTotal + totalTips;

        // Check if enough was paid
        if (totalPaid < finalTotalWithTips) {
          toast.error(
            `Total paid (${formatCurrency(
              totalPaid
            )}) is less than the required amount (${formatCurrency(
              finalTotalWithTips
            )})`
          );
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/orders/${order.id}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            splitPayments: splitPayments.map((payment) => ({
              paymentMethod: payment.paymentMethod,
              amount: payment.amount,
              tipAmount: payment.tipAmount,
              notes,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to process payment");
        }

        setReceiptData(data.receipt);
        setShowReceipt(true);
        toast.success("Split payment processed successfully");
      } else {
        // Regular single payment
        if (!amountTendered || parseFloat(amountTendered) <= 0) {
          toast.error("Please enter a valid amount tendered");
          setLoading(false);
          return;
        }

        if (parseFloat(amountTendered) < finalTotal) {
          toast.error(
            `Amount tendered (${formatCurrency(
              parseFloat(amountTendered)
            )}) is less than the total amount (${formatCurrency(finalTotal)})`
          );
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/orders/${order.id}/payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            paymentMethod,
            tipAmount,
            totalPaid: amountTendered,
            notes,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to process payment");
        }

        setReceiptData(data.receipt);
        setShowReceipt(true);
        toast.success("Payment processed successfully");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process payment"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add a new split payment
  const addSplitPayment = () => {
    setSplitPayments([
      ...splitPayments,
      {
        id: `split-${splitPayments.length + 1}`,
        paymentMethod: PAYMENT_METHODS.CASH,
        amount: "",
        tipAmount: "0",
      },
    ]);
  };

  // Remove a split payment
  const removeSplitPayment = (id: string) => {
    if (splitPayments.length <= 1) {
      return;
    }
    setSplitPayments(splitPayments.filter((payment) => payment.id !== id));
  };

  // Update a split payment
  const updateSplitPayment = (
    id: string,
    field: keyof SplitPayment,
    value: string
  ) => {
    setSplitPayments(
      splitPayments.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  // Calculate totals for split payments
  const splitPaymentTotal = splitPayments.reduce(
    (sum, payment) => sum + parseFloat(payment.amount || "0"),
    0
  );

  const splitTipTotal = splitPayments.reduce(
    (sum, payment) => sum + parseFloat(payment.tipAmount || "0"),
    0
  );

  const splitFinalTotal = orderTotal + splitTipTotal;
  const splitRemaining = Math.max(0, splitFinalTotal - splitPaymentTotal);

  // Get payment method icon
  const getPaymentIcon = (method: string) => {
    switch (method) {
      case PAYMENT_METHODS.CASH:
        return <DollarSign className="h-4 w-4" />;
      case PAYMENT_METHODS.CREDIT_CARD:
      case PAYMENT_METHODS.DEBIT_CARD:
        return <CreditCard className="h-4 w-4" />;
      case PAYMENT_METHODS.MOBILE_PAYMENT:
        return <Smartphone className="h-4 w-4" />;
      case PAYMENT_METHODS.GIFT_CARD:
        return <GiftIcon className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Add state for showing receipt
  const [showReceipt, setShowReceipt] = useState(false);

  // Update the receipt view display
  if (showReceipt && receiptData) {
    return (
      <Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Thank you for your payment</DialogDescription>
          </DialogHeader>

          <ReceiptView
            receipt={receiptData}
            order={order}
            onClose={() => {
              onPaymentComplete(receiptData);
              onClose();
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Process Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm mb-1">
              <span>Order #:</span>
              <span>{order.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Table:</span>
              <span>{order.tableName}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Items:</span>
              <span>{order.items?.length || 0}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Order Total:</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
          </div>

          {/* Split Payment Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="split-payment"
              checked={useSplitPayment}
              onCheckedChange={setUseSplitPayment}
            />
            <Label htmlFor="split-payment">Split Payment</Label>
          </div>

          {useSplitPayment ? (
            // Split Payment UI
            <div className="space-y-4">
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {splitPayments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="p-3 border rounded-md space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Payment {index + 1}</h4>
                      {splitPayments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500"
                          onClick={() => removeSplitPayment(payment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`payment-method-${payment.id}`}>
                          Payment Method
                        </Label>
                        <Select
                          value={payment.paymentMethod}
                          onValueChange={(value) =>
                            updateSplitPayment(
                              payment.id,
                              "paymentMethod",
                              value
                            )
                          }
                        >
                          <SelectTrigger id={`payment-method-${payment.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={PAYMENT_METHODS.CASH}>
                              <div className="flex items-center">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Cash
                              </div>
                            </SelectItem>
                            <SelectItem value={PAYMENT_METHODS.CREDIT_CARD}>
                              <div className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Credit Card
                              </div>
                            </SelectItem>
                            <SelectItem value={PAYMENT_METHODS.DEBIT_CARD}>
                              <div className="flex items-center">
                                <CreditCard className="mr-2 h-4 w-4" />
                                Debit Card
                              </div>
                            </SelectItem>
                            <SelectItem value={PAYMENT_METHODS.MOBILE_PAYMENT}>
                              <div className="flex items-center">
                                <Smartphone className="mr-2 h-4 w-4" />
                                Mobile Payment
                              </div>
                            </SelectItem>
                            <SelectItem value={PAYMENT_METHODS.GIFT_CARD}>
                              <div className="flex items-center">
                                <GiftIcon className="mr-2 h-4 w-4" />
                                Gift Card
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`amount-${payment.id}`}>Amount</Label>
                        <Input
                          id={`amount-${payment.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) =>
                            updateSplitPayment(
                              payment.id,
                              "amount",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tip-${payment.id}`}>Tip Amount</Label>
                      <Input
                        id={`tip-${payment.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={payment.tipAmount}
                        onChange={(e) =>
                          updateSplitPayment(
                            payment.id,
                            "tipAmount",
                            e.target.value
                          )
                        }
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={addSplitPayment}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Payment Method
              </Button>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Order Total:</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Tips:</span>
                  <span>{formatCurrency(splitTipTotal)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Final Total:</span>
                  <span>{formatCurrency(splitFinalTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(splitPaymentTotal)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Remaining:</span>
                  <span
                    className={
                      splitRemaining > 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {formatCurrency(splitRemaining)}
                  </span>
                </div>
                {splitPaymentTotal > splitFinalTotal && (
                  <div className="flex justify-between text-green-600">
                    <span>Change:</span>
                    <span>
                      {formatCurrency(splitPaymentTotal - splitFinalTotal)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Single Payment UI
            <div className="space-y-4">
              <Tabs defaultValue="payment">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payment">Payment</TabsTrigger>
                  <TabsTrigger value="tip">Tip</TabsTrigger>
                </TabsList>

                <TabsContent value="payment" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger id="payment-method">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PAYMENT_METHODS.CASH}>
                          <div className="flex items-center">
                            <DollarSign className="mr-2 h-4 w-4" />
                            Cash
                          </div>
                        </SelectItem>
                        <SelectItem value={PAYMENT_METHODS.CREDIT_CARD}>
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Credit Card
                          </div>
                        </SelectItem>
                        <SelectItem value={PAYMENT_METHODS.DEBIT_CARD}>
                          <div className="flex items-center">
                            <CreditCard className="mr-2 h-4 w-4" />
                            Debit Card
                          </div>
                        </SelectItem>
                        <SelectItem value={PAYMENT_METHODS.MOBILE_PAYMENT}>
                          <div className="flex items-center">
                            <Smartphone className="mr-2 h-4 w-4" />
                            Mobile Payment
                          </div>
                        </SelectItem>
                        <SelectItem value={PAYMENT_METHODS.GIFT_CARD}>
                          <div className="flex items-center">
                            <GiftIcon className="mr-2 h-4 w-4" />
                            Gift Card
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount-tendered">Amount Tendered</Label>
                    <Input
                      id="amount-tendered"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  {paymentMethod === PAYMENT_METHODS.CASH && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {quickAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setAmountTendered(amount.toString())}
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="payment-notes">Notes (Optional)</Label>
                    <Input
                      id="payment-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any special notes for this payment"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="tip" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tip-amount">Tip Amount</Label>
                    <Input
                      id="tip-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {tipPresets.map((percentage) => (
                      <Button
                        key={percentage}
                        variant="outline"
                        size="sm"
                        onClick={() => applyTipPercentage(percentage)}
                      >
                        {percentage}%
                      </Button>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Order Total:</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tip:</span>
                  <span>{formatCurrency(tipValue)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Final Total:</span>
                  <span>{formatCurrency(finalTotal)}</span>
                </div>
                {amountTendered && parseFloat(amountTendered) > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Tendered:</span>
                      <span>{formatCurrency(parseFloat(amountTendered))}</span>
                    </div>
                    {parseFloat(amountTendered) >= finalTotal && (
                      <div className="flex justify-between text-green-600">
                        <span>Change:</span>
                        <span>
                          {formatCurrency(
                            parseFloat(amountTendered) - finalTotal
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={loading}>
            {loading ? "Processing..." : "Process Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
