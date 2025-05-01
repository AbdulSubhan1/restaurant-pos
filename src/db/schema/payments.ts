import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  json,
} from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { relations } from "drizzle-orm";

// Define the payment methods type
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  MOBILE_PAYMENT: "mobile_payment",
  GIFT_CARD: "gift_card",
} as const;

// Define the payment statuses
export const PAYMENT_STATUSES = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
} as const;

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(),
  amount: text("amount").notNull(), // Store as text to preserve precision
  tipAmount: text("tip_amount").default("0"), // Store as text to preserve precision
  totalAmount: text("total_amount").notNull(), // Store as text to preserve precision
  status: text("status").notNull().default(PAYMENT_STATUSES.COMPLETED),
  reference: text("reference"), // For transaction reference or receipt number
  metadata: json("metadata").$type<Record<string, any>>(), // For additional payment data
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
