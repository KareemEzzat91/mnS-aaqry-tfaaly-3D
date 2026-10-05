import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { buildingsTable } from "./buildings";

export const unitsTable = pgTable("units", {
  id: text("id").primaryKey(),
  buildingId: text("building_id")
    .notNull()
    .references(() => buildingsTable.id, { onDelete: "cascade" }),
  floor: integer("floor").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: integer("bathrooms").notNull(),
  areaM2: integer("area_m2").notNull(),
  price: integer("price").notNull(),
  currency: text("currency").notNull(),
  view: text("view").notNull(),
  status: text("status", { enum: ["available", "reserved", "sold"] })
    .notNull()
    .default("available"),
});

export const insertUnitSchema = createInsertSchema(unitsTable);
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type UnitRecord = typeof unitsTable.$inferSelect;
