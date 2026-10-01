# Project Progress

## Project

Developer Event Dashboard. The approved PRD and TRD are in `docs/`. The workspace now contains the initial Next.js application scaffold.

## Current phase and capability

- Phase: WP-01, project foundation and early public gate.
- Completed capabilities: runtime foundation/local runtime compatibility; Project and ApiKey data model and migrations; Clerk account authentication and public landing page; owner-scoped project workspace; API-key issuance, revocation, and replacement.
- Current capability checkpoint: signed-in owners can create/list projects, view project details, issue one active key, revoke it, and replace it. The API guide, event ingestion, and event/request dashboards remain open.
- TRD SP-05: pinned toolchain, Prisma client generation, schema validation, ESLint, TypeScript, and production build verified. Prisma reports both migrations applied and the database schema up to date on the configured Neon production branch.

## Completed

- Initialized the Git repository and committed the approved PRD/TRD alongside the starter application.
- Pinned Node 24.16.0, npm 11.13.0, Next.js 16.3.8, Clerk 7.9.9, and Prisma 7.10.0 with the PostgreSQL driver adapter.
- Added environment placeholders with separate runtime and migration database URLs; no real credentials are stored.
- Added a minimal PostgreSQL Prisma schema and generated client successfully.
- Verified clean dependency installation, Prisma generation, ESLint, TypeScript, and production build.
- Added Project and ApiKey models with UUIDs, Clerk ownership ID, key hash/display metadata, version and lifecycle timestamps, ordered indexes, project cascade relation, unique composite key, and partial unique active-key index.
- Generated and reviewed the Project/ApiKey and ManagementBucket migrations; both have been applied to the configured Neon production database and verified with `prisma migrate status`.
- Added ClerkProvider, dedicated sign-in/sign-up routes, Clerk session middleware, and a server-side `auth.protect()` check on `/projects`; sign-up/sign-in redirect into the protected workspace and Clerk's user menu provides sign-out.
- Replaced the starter landing page with responsive product orientation and entry points. Local HTTP smoke check returned 200 for `/`, `/sign-in`, and `/sign-up`; unauthenticated `/projects` redirected to `/sign-in`.
- Added the signed-in project workspace, paginated project list, project creation API, and owner-scoped project detail page/API. Project creation uses server-derived Clerk ownership, request validation, same-origin checks, and an atomic per-account minute bucket. Project details expose only safe API-key display metadata.
- Verified the project capability with ESLint, TypeScript, production build, Prisma migration status, and diff hygiene review.
- Added owner-scoped API routes and UI for initial key issuance, revocation, and confirmed replacement. Keys use 32 random secret bytes, store only the SHA-256 hash, reveal the full value only in the successful mutation response and transient panel, and return only display hints on reads. Mutations lock the project row, check `keyVersion`, update key state atomically, and use the per-account `KEY_MUTATION` bucket.
- Verified the key lifecycle with ESLint, TypeScript, production build, Prisma schema validation, and diff hygiene review. No authenticated key mutation was run against the configured production database.
- Verified the configured Clerk development secret with a read-only instance request. A complete interactive account signup/signin has not yet been performed; production Clerk setup remains pending.

## Remaining capabilities

1. Complete WP-01: rehearse the schema on isolated PostgreSQL, add the API guide and project CRUD/ownership flow, and complete the early public deployment gate.
2. WP-02: key issuance/revocation services, event validation and ingestion, distributed rolling limit, and initial dashboard read.
3. WP-03: retained event/request views, attributable rejections, key management UI, retention cleanup, privacy/support content, and abuse controls.
4. WP-04: accessibility/mobile review, complete CI and acceptance evidence, migration/recovery rehearsal, and release decision.

## Requirements and design references

- Foundation and schema support the approved Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel design in the TRD; Project and ApiKey fields and indexes follow TRD §9.
- PRD FR-01 is partially implemented (landing, account entry points, project create/list/detail; API guide and public deployment remain). FR-02 account authentication/session and project ownership checks are implemented. FR-04/FR-05 key issuance and revoke/replace flows are implemented. Event submission, activity views, and release NFR evidence remain open.
- TRD SP-01 uses Clerk development credentials locally. Production Clerk domain, credentials, and fresh-account verification remain deployment work.

## Approved decisions

- D-01: Clerk production authentication on an owned domain.
- D-02: exact 30-day visible history with daily physical cleanup and at most 25-hour normal-operation lag.
- D-03: approved validation, rolling admission, engineering, and recovery baseline.

## Known issues and release blockers

- No production domain, production Clerk configuration, Vercel deployment, abuse-control decision, support destination, budget, or recovery evidence has been configured.
- The configured database is the Neon `production` branch. Both migrations are applied and Prisma reports the schema up to date. Authenticated project and key mutation flows still need end-to-end verification in a disposable development/preview database and fresh Clerk account.
- Docker CLI is installed but its daemon is unavailable in this workspace.
- Deployment target remains the TRD-approved Vercel path. The user asked whether Docker could be the deployment target, but has not specified local development use versus replacing Vercel; no deployment-plan change has been made.
- `.env.example` contains placeholders only. Production authentication and deployment integration remain unverified.
- `prisma.config.ts` loads `.env.local` through `@next/env`, so Prisma CLI commands use the configured direct `MIGRATION_DATABASE_URL`.
- The input TRD contains pre-existing trailing whitespace, reported by `git diff --cached --check` when the source document was first committed.

## Last implementation checkpoint

- `28010c7` — `feat: add Clerk account authentication`
- `7eca280` — `feat: add owner-scoped project workspace`
- `db87061` — `feat: add project API key lifecycle`
