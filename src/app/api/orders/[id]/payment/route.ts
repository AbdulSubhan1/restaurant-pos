import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema/orders";
import {
  payments,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "@/db/schema/payments";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth-utils";
import { v4 as uuidv4 } from "uuid";

// POST /api/orders/[id]/payment - Process payment for an order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify user authentication
    const token = request.cookies.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = await verifyToken(token);
    if (!userId) {
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const paramsData = await params;
    const orderId = parseInt(paramsData.id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: "Invalid order ID" },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!existingOrder || existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is already paid
    if (existingOrder[0].status === "paid") {
      return NextResponse.json(
        { success: false, message: "Order is already paid" },
        { status: 400 }
      );
    }

    // Check if order is cancelled
    if (existingOrder[0].status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot process payment for a cancelled order",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      paymentMethod,
      tipAmount = "0",
      totalPaid,
      notes,
      splitPayments = [],
    } = body;

    // Check if we're doing a single payment or split payment
    if (splitPayments.length > 0) {
      return handleSplitPayment(orderId, splitPayments, existingOrder[0]);
    }

    // Handle single payment
    // Validate payment method
    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, message: "Payment method is required" },
        { status: 400 }
      );
    }

    // Check if payment method is valid
    if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment method",
          validMethods: Object.values(PAYMENT_METHODS),
        },
        { status: 400 }
      );
    }

    // Validate total paid
    if (!totalPaid) {
      return NextResponse.json(
        { success: false, message: "Total paid amount is required" },
        { status: 400 }
      );
    }

    // Calculate final amount
    const orderAmount = parseFloat(existingOrder[0].totalAmount.toString());
    const tip = parseFloat(tipAmount.toString());
    const finalAmount = orderAmount + tip;
    const paid = parseFloat(totalPaid.toString());

    // Check if paid amount is sufficient
    if (paid < finalAmount) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient payment amount",
          orderAmount,
          tipAmount: tip,
          totalAmount: finalAmount,
          amountPaid: paid,
          shortfall: finalAmount - paid,
        },
        { status: 400 }
      );
    }

    // Generate a reference number
    const reference = `RCT-${Date.now().toString().slice(-6)}-${uuidv4().slice(
      0,
      4
    )}`;

    // Insert payment record
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        orderId,
        paymentMethod,
        amount: orderAmount.toString(),
        tipAmount: tip.toString(),
        totalAmount: finalAmount.toString(),
        status: PAYMENT_STATUSES.COMPLETED,
        reference,
        notes: notes || null,
        metadata: {
          serverName: userId.name || "Staff",
          serverId: userId.id,
          paymentProcessor: "manual", // Since we don't have an actual payment processor
          amountPaid: paid.toString(),
          change: (paid - finalAmount).toString(),
        },
      })
      .returning();

    // Update order status to paid
    await db
      .update(orders)
      .set({
        status: "paid",
        notes: notes || `Paid with ${paymentMethod}`,
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Generate receipt data
    const receipt = {
      receiptNumber: reference,
      orderId,
      orderAmount: orderAmount.toFixed(2),
      tipAmount: tip.toFixed(2),
      totalAmount: finalAmount.toFixed(2),
      amountPaid: paid.toFixed(2),
      change: (paid - finalAmount).toFixed(2),
      paymentMethod,
      paidAt: new Date().toISOString(),
      paymentStatus: PAYMENT_STATUSES.COMPLETED,
      server: userId.name || "Staff",
      transactionId: paymentRecord.reference,
    };

    // Return success response with receipt
    return NextResponse.json({
      success: true,
      message: "Payment processed successfully",
      receipt,
      paymentId: paymentRecord.id,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process payment" },
      { status: 500 }
    );
  }
}

// Handle split payments
async function handleSplitPayment(
  orderId: number,
  splitPayments: any[],
  existingOrder: any
) {
  try {
    // Validate split payments
    if (!Array.isArray(splitPayments) || splitPayments.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid split payment data" },
        { status: 400 }
      );
    }

    // Calculate order amount
    const orderAmount = parseFloat(existingOrder.totalAmount.toString());

    // Calculate the total from all split payments
    let totalPaid = 0;
    let totalTip = 0;

    // Validate each payment method and add up amounts
    for (const payment of splitPayments) {
      if (!payment.paymentMethod || !payment.amount) {
        return NextResponse.json(
          {
            success: false,
            message: "Each payment requires a method and amount",
          },
          { status: 400 }
        );
      }

      // Check if payment method is valid
      if (!Object.values(PAYMENT_METHODS).includes(payment.paymentMethod)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid payment method",
            validMethods: Object.values(PAYMENT_METHODS),
          },
          { status: 400 }
        );
      }

      totalPaid += parseFloat(payment.amount.toString());
      totalTip += parseFloat(payment.tipAmount?.toString() || "0");
    }

    // Final amount with tip
    const finalAmount = orderAmount + totalTip;

    // Check if total paid is sufficient
    if (totalPaid < finalAmount) {
      return NextResponse.json(
        {
          success: false,
          message: "Insufficient total payment amount",
          orderAmount,
          tipAmount: totalTip,
          totalAmount: finalAmount,
          amountPaid: totalPaid,
          shortfall: finalAmount - totalPaid,
        },
        { status: 400 }
      );
    }

    // Process each payment
    const paymentRecords = [];
    for (const payment of splitPayments) {
      const amount = parseFloat(payment.amount.toString());
      const tip = parseFloat(payment.tipAmount?.toString() || "0");
      const reference = `RCT-${Date.now()
        .toString()
        .slice(-6)}-${uuidv4().slice(0, 4)}`;

      // Calculate share of order amount (excluding tip)
      const orderAmountShare = amount - tip > 0 ? amount - tip : 0;

      const [paymentRecord] = await db
        .insert(payments)
        .values({
          orderId,
          paymentMethod: payment.paymentMethod,
          amount: orderAmountShare.toString(),
          tipAmount: tip.toString(),
          totalAmount: amount.toString(),
          status: PAYMENT_STATUSES.COMPLETED,
          reference,
          notes: payment.notes || null,
          metadata: {
            serverName: payment.serverName || "Staff",
            serverId: payment.serverId || 0,
            paymentProcessor: "manual",
            splitPayment: true,
            splitIndex: splitPayments.indexOf(payment),
            totalSplits: splitPayments.length,
          },
        })
        .returning();

      paymentRecords.push(paymentRecord);
    }

    // Update order status to paid
    await db
      .update(orders)
      .set({
        status: "paid",
        notes: `Split payment with ${splitPayments.length} methods`,
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    // Generate consolidated receipt data
    const receipt = {
      orderId,
      orderAmount: orderAmount.toFixed(2),
      tipAmount: totalTip.toFixed(2),
      totalAmount: finalAmount.toFixed(2),
      amountPaid: totalPaid.toFixed(2),
      change: (totalPaid - finalAmount).toFixed(2),
      paymentMethods: splitPayments.map((p) => p.paymentMethod),
      paidAt: new Date().toISOString(),
      paymentStatus: PAYMENT_STATUSES.COMPLETED,
      splitPayment: true,
      payments: paymentRecords.map((pr) => ({
        id: pr.id,
        reference: pr.reference,
        method: pr.paymentMethod,
        amount: pr.amount,
      })),
    };

    return NextResponse.json({
      success: true,
      message: "Split payment processed successfully",
      receipt,
      paymentIds: paymentRecords.map((pr) => pr.id),
    });
  } catch (error) {
    console.error("Error processing split payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process split payment" },
      { status: 500 }
    );
  }
}
