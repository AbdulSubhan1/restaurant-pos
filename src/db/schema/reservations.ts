import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  decimal,
  text,
  boolean,
} from "drizzle-orm/pg-core";
import { tables } from "./tables";
import { users } from "./users";

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  partySize: integer("party_size").notNull(),
  reservationDate: timestamp("reservation_date").notNull(),
  reservationTime: varchar("reservation_time", { length: 10 }).notNull(), // Format: "HH:MM"
  duration: integer("duration").notNull().default(120), // Duration in minutes
  status: varchar("status", { length: 50 }).notNull().default("confirmed"), // confirmed, cancelled, completed, no-show
  specialRequests: text("special_requests"),
  notes: text("notes"),
  // Staff who handled the reservation
  createdBy: integer("created_by").references(() => users.id),
  // Auto-expiry tracking
  expiresAt: timestamp("expires_at").notNull(),
  isExpired: boolean("is_expired").notNull().default(false),
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  cancelledAt: timestamp("cancelled_at"),
  completedAt: timestamp("completed_at"),
});

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
