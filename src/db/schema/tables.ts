import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  text,
  json,
} from "drizzle-orm/pg-core";

export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  capacity: integer("capacity").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("available"),
  xPosition: integer("x_position").notNull().default(0), // For visual layout
  yPosition: integer("y_position").notNull().default(0), // For visual layout
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  // New fields for merge functionality
  isMerged: boolean("is_merged").notNull().default(false),
  mergedFromTables: json("merged_from_tables").$type<number[]>().default([]), // Array of original table IDs
  originalTableData: json("original_table_data").$type<{
    id: number;
    name: string;
    capacity: number;
    xPosition: number;
    yPosition: number;
    notes: string | null;
  }[]>().default([]), // Store original table data for splitting
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;