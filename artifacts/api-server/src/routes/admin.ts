import { and, desc, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetAdminLeadsResponse,
  UpdateAdminLeadBody,
  UpdateAdminLeadParams,
  UpdateAdminLeadResponse,
  UpdateAdminUnitBody,
  UpdateAdminUnitParams,
  UpdateAdminUnitResponse,
} from "@workspace/api-zod";
import {
  buildingsTable,
  db,
  leadsTable,
  projectsTable,
  unitsTable,
} from "@workspace/db";
import { requireAdmin, requireSameOrigin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.use(requireSameOrigin, requireAdmin);

router.get("/leads", async (req, res): Promise<void> => {
  const leads = await db
    .select()
    .from(leadsTable)
    .orderBy(desc(leadsTable.createdAt))
    .limit(100);

  res.json(
    GetAdminLeadsResponse.parse(
      leads.map((lead) => ({
        ...lead,
        createdAt: lead.createdAt.toISOString(),
      })),
    ),
  );
});

router.patch("/leads/:leadId", async (req, res): Promise<void> => {
  const params = UpdateAdminLeadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid inquiry identifier." });
    return;
  }

  const body = UpdateAdminLeadBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid inquiry status." });
    return;
  }

  const [lead] = await db
    .update(leadsTable)
    .set({ status: body.data.status })
    .where(eq(leadsTable.id, params.data.leadId))
    .returning();

  if (!lead) {
    res.status(404).json({ error: "Inquiry not found." });
    return;
  }

  res.json(
    UpdateAdminLeadResponse.parse({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
    }),
  );
});

router.patch("/units/:unitId", async (req, res): Promise<void> => {
  const params = UpdateAdminUnitParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid home identifier." });
    return;
  }

  const body = UpdateAdminUnitBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid home status or asking price." });
    return;
  }

  const unit = await db.transaction(async (tx) => {
    const [updatedUnit] = await tx
      .update(unitsTable)
      .set(body.data)
      .where(eq(unitsTable.id, params.data.unitId))
      .returning();

    if (!updatedUnit) {
      return undefined;
    }

    const availableUnitCount =
      sql<number>`count(*) filter (where ${unitsTable.status} = 'available')`.mapWith(
        Number,
      );
    const [buildingStats] = await tx
      .select({ availableUnits: availableUnitCount })
      .from(unitsTable)
      .where(eq(unitsTable.buildingId, updatedUnit.buildingId));

    await tx
      .update(buildingsTable)
      .set({ availableUnits: buildingStats?.availableUnits ?? 0 })
      .where(eq(buildingsTable.id, updatedUnit.buildingId));

    const [projectStats] = await tx
      .select({
        availableHomes: availableUnitCount,
        startingPrice:
          sql<number>`min(${unitsTable.price}) filter (where ${unitsTable.status} = 'available')`.mapWith(
            Number,
          ),
      })
      .from(unitsTable)
      .innerJoin(buildingsTable, eq(unitsTable.buildingId, buildingsTable.id))
      .where(eq(buildingsTable.projectId, "vivid-city"));

    await tx
      .update(projectsTable)
      .set({
        availableHomes: projectStats?.availableHomes ?? 0,
        startingPrice: projectStats?.startingPrice ?? 0,
      })
      .where(eq(projectsTable.id, "vivid-city"));

    return updatedUnit;
  });

  if (!unit) {
    res.status(404).json({ error: "Home not found." });
    return;
  }

  res.json(UpdateAdminUnitResponse.parse(unit));
});

export default router;
