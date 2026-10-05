import { createInsertSchema } from "drizzle-zod";
import { integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  location: text("location").notNull(),
  description: text("description").notNull(),
  completion: text("completion").notNull(),
  totalHomes: integer("total_homes").notNull(),
  availableHomes: integer("available_homes").notNull(),
  startingPrice: numeric("starting_price", {
    precision: 14,
    scale: 2,
    mode: "number",
  }).notNull(),
  currency: text("currency").notNull(),
  amenities: text("amenities").array().notNull().default([]),
});

export const insertProjectSchema = createInsertSchema(projectsTable);
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type ProjectRecord = typeof projectsTable.$inferSelect;
