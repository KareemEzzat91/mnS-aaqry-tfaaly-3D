import { and, asc, eq } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateLeadBody,
  CreateLeadResponse,
  GetBuildingsResponse,
  GetProjectResponse,
  GetUnitParams,
  GetUnitResponse,
  GetUnitsQueryParams,
  GetUnitsResponse,
} from "@workspace/api-zod";
import {
  buildingsTable,
  db,
  leadsTable,
  projectsTable,
  unitsTable,
} from "@workspace/db";
import { requireSameOrigin } from "../middlewares/requireAdmin";

const router: IRouter = Router();

router.get("/project", async (_req, res): Promise<void> => {
  const [project] = await db
    .select()
    .from(projectsTable)
    .where(eq(projectsTable.id, "vivid-city"))
    .limit(1);

  if (!project) {
    res.status(503).json({ error: "Project data is not available yet." });
    return;
  }

  res.json(GetProjectResponse.parse(project));
});

router.get("/buildings", async (_req, res): Promise<void> => {
  const buildings = await db
    .select()
    .from(buildingsTable)
    .where(eq(buildingsTable.projectId, "vivid-city"))
    .orderBy(asc(buildingsTable.id));

  res.json(GetBuildingsResponse.parse(buildings));
});

router.get("/units", async (req, res): Promise<void> => {
  const parsedQuery = GetUnitsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    req.log.warn({ errors: parsedQuery.error.message }, "Invalid unit filters");
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const filters = [];
  if (parsedQuery.data.buildingId) {
    filters.push(eq(unitsTable.buildingId, parsedQuery.data.buildingId));
  }
  if (parsedQuery.data.floor !== undefined) {
    filters.push(eq(unitsTable.floor, parsedQuery.data.floor));
  }
  if (parsedQuery.data.bedrooms !== undefined) {
    filters.push(eq(unitsTable.bedrooms, parsedQuery.data.bedrooms));
  }

  const units = await db
    .select()
    .from(unitsTable)
    .where(and(...filters))
    .orderBy(
      asc(unitsTable.buildingId),
      asc(unitsTable.floor),
      asc(unitsTable.id),
    );

  res.json(GetUnitsResponse.parse(units));
});

router.get("/units/:unitId", async (req, res): Promise<void> => {
  const parsedParams = GetUnitParams.safeParse(req.params);
  if (!parsedParams.success) {
    res.status(400).json({ error: parsedParams.error.message });
    return;
  }

  const [unit] = await db
    .select()
    .from(unitsTable)
    .where(eq(unitsTable.id, parsedParams.data.unitId))
    .limit(1);

  if (!unit) {
    res.status(404).json({ error: "Unit not found." });
    return;
  }

  res.json(GetUnitResponse.parse(unit));
});

router.post("/leads", requireSameOrigin, async (req, res): Promise<void> => {
  const parsedBody = CreateLeadBody.safeParse(req.body);
  if (!parsedBody.success) {
    req.log.warn({ errors: parsedBody.error.message }, "Invalid sales inquiry");
    res.status(400).json({ error: parsedBody.error.message });
    return;
  }

  const name = parsedBody.data.name.trim();
  const phone = parsedBody.data.phone.trim();
  if (!name || !phone) {
    res.status(400).json({ error: "Name and phone are required." });
    return;
  }

  const [unit] = await db
    .select({ id: unitsTable.id, status: unitsTable.status })
    .from(unitsTable)
    .where(eq(unitsTable.id, parsedBody.data.unitId))
    .limit(1);

  if (!unit) {
    res.status(400).json({ error: "The selected unit is not available." });
    return;
  }
  if (unit.status !== "available") {
    res.status(400).json({ error: "This home is no longer available for visits." });
    return;
  }

  const [lead] = await db
    .insert(leadsTable)
    .values({
      name,
      phone,
      email: parsedBody.data.email?.trim() || null,
      unitId: parsedBody.data.unitId,
      message: parsedBody.data.message?.trim() || null,
      consent: parsedBody.data.consent,
    })
    .returning({
      id: leadsTable.id,
      createdAt: leadsTable.createdAt,
    });

  res.status(201).json(
    CreateLeadResponse.parse({
      id: lead.id,
      submittedAt: lead.createdAt.toISOString(),
    }),
  );
});

export default router;
