import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  boolean,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const layouts = pgTable("layouts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  elements: jsonb("elements").notNull().$type<any[]>(),
  metadata: jsonb("metadata").$type<any>(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Layout = InferSelectModel<typeof layouts>;
export type NewLayout = InferInsertModel<typeof layouts>;
