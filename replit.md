# VIVID City — Real Estate Explorer

An Arabic-first sample real-estate showroom for exploring a development, browsing homes, sharing unit pages, and requesting a private visit.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/vivid-city run dev` — run the Vite web app through its managed workflow
- `pnpm run typecheck` — typecheck libraries and all workspace apps
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push schema changes to the development database only

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Web: React, Vite, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation and API codegen: Zod, Orval, contract-first OpenAPI
- API bundling: esbuild

## Where things live

- `artifacts/vivid-city/` — Arabic-first public visitor experience and private sales dashboard
- `artifacts/api-server/` — public project, building, unit, and visit-request endpoints plus protected staff APIs
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/db/src/schema/` — Drizzle schema; seed data lives with the database package

## Architecture decisions

- Keep the OpenAPI file as the API source of truth and regenerate shared hooks/schemas after contract changes.
- Keep lead contact details behind Clerk authentication and server-side authorization against the configured staff allowlist; never expose them through public routes.
- Current inventory, prices, completion date, visuals, and floor plans are illustrative sample content, not verified development information.

## Product

- Visitors can explore the sample site plan, filter homes by building/floor/bedrooms, view unit details, copy a deep link or display a QR code, and request a visit with explicit consent.
- Authorized sales staff can review and update lead statuses and edit listing availability and prices from the private dashboard.
- AR/VR experiences remain deferred until approved architectural assets are available.

## User preferences

- None recorded.

## Gotchas

- Replace sample listings, prices, dates, artwork, and illustrative plans with approved project assets before presenting this as a live development.
- Keep lead details private; do not expose them through unauthenticated API routes or an unrestricted dashboard.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
