import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const buildingsTable = pgTable("buildings", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projectsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  floors: integer("floors").notNull(),
  totalUnits: integer("total_units").notNull(),
  availableUnits: integer("available_units").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
});

export const insertBuildingSchema = createInsertSchema(buildingsTable);
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type BuildingRecord = typeof buildingsTable.$inferSelect;
