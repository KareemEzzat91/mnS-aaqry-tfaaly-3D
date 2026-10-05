import { createInsertSchema } from "drizzle-zod";
import { timestamp, uuid, pgTable, text, boolean } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { unitsTable } from "./units";

export const leadsTable = pgTable("leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  unitId: text("unit_id")
    .notNull()
    .references(() => unitsTable.id, { onDelete: "restrict" }),
  message: text("message"),
  consent: boolean("consent").notNull(),
  status: text("status", {
    enum: ["new", "contacted", "visit_scheduled", "closed"],
  })
    .notNull()
    .default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type LeadRecord = typeof leadsTable.$inferSelect;
