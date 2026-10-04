# Project Progress

## Project

Developer Event Dashboard. The approved PRD and TRD are in `docs/`. The workspace now contains the initial Next.js application scaffold.

## Current phase and capability

- Phase: WP-03, retention and release safeguards.
- Completed capabilities: runtime foundation/local runtime compatibility; Project and ApiKey data model and migrations; Clerk account authentication and public landing page; owner-scoped project workspace; API-key issuance, revocation, and replacement; public event ingestion with attributable outcomes and project-wide rolling admission; public API guide; owner-scoped 30-day activity dashboard and read APIs; scheduled retention cleanup implementation; privacy and support pages.
- Current capability checkpoint: signed-in owners can create/list projects, view project details, issue one active key, revoke it, and replace it. Developers can submit named events through `POST /api/v1/events`; accepted events and attributable rejections are stored in `RequestRecord`. Project details show a consistent 30-day activity snapshot, with authenticated paginated read APIs. A `CRON_SECRET`-protected internal endpoint is scheduled daily at 02:00 UTC to purge expired history and old management buckets. Public privacy/support pages are available, with the contact channel supplied through `SUPPORT_URL`.
- TRD SP-05: pinned toolchain, Prisma client generation, schema validation, ESLint, TypeScript, and production build verified. The first three migrations were previously verified up to date. The user reports applying the retention migration; this runtime's follow-up status check failed with a generic schema-engine error, so that report could not be independently confirmed here.

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
- Added `POST /api/v1/events` with bounded header/body handling, complete API-key hash verification, strict event-name validation, and the `INGESTION_ENABLED` emergency switch. Accepted events and attributable rejections are persisted as one `RequestRecord` outcome.
- Added project-row-locked rolling admission at 60 active-key attempts per 60 seconds, shared across key replacement and app instances. The `RequestRecord` migration includes outcome constraints, project/key foreign keys, and the recent-view, accepted-event, admission, and cleanup indexes.
- Verified the ingestion capability with Prisma schema validation/client generation, TypeScript, ESLint, production build, and diff review. The user applied its migration to the configured Neon database and a later status check confirmed it; no authenticated ingestion request was run against production.
- Added a public API guide with PowerShell/curl setup, event validation rules, success/error examples, key-safety guidance, rate limit, retry behavior, and the 30-day history policy. Linked it from the landing-page navigation and primary action. Updated example event names to match the validator's underscore format.
- Verified the API guide with TypeScript, ESLint, production build, and diff review. The guide describes the ingestion endpoint; dashboard history and scheduled cleanup are implemented, while deployed cleanup verification remains open.
- Added an owner-scoped project activity dashboard showing 30-day request totals, accepted/rejected outcomes, event counts by name, recent accepted events, and recent attributable request outcomes. A failed activity read is displayed as unavailable rather than as zero activity.
- Added authenticated, project-owner-scoped summary, event-count, recent-event, and recent-request read APIs. Paginated endpoints use bounded limits, endpoint/project-bound cursors, stable ordering, and a fixed 30-day snapshot window.
- Verified this capability with TypeScript, ESLint, and `git diff --check`. Its initial production build attempt could not fetch the existing Google Fonts; a later full production build completed successfully during retention cleanup verification. No schema or migration changes were needed for the dashboard capability.
- Added `MaintenanceState` and its migration, plus a protected `GET /api/internal/retention` job scheduled daily at 02:00 UTC. It uses a transaction-scoped advisory lock, a fixed database cutoff, 1,000-row deletion batches capped at 10,000 request records per invocation, 25-hour management-bucket cleanup, and marks success only when no expired request records remain.
- Verified retention cleanup with Prisma client generation/schema validation, TypeScript, ESLint, production build, Vercel schedule JSON parsing, and diff review. The user reports that the migration was applied; the subsequent read-only status attempt in this runtime returned a generic schema-engine error. The cleanup job itself has not been run against a database, and no deployed scheduled invocation has been verified.
- Added a public privacy notice covering Clerk identity references, project/key metadata, event and attributable outcome data, the live 30-day policy, data-minimization guidance, and the separate retention scope for logs and backups. Added a support page with a deployment-configured HTTPS or `mailto:` destination and a safe fallback when unset; shared footer links are available from the landing page, API guide, project list, and project details.
- Updated the API guide to describe the implemented dashboard and daily cleanup policy. Verified the privacy/support capability with TypeScript, ESLint, production build, and diff review. `SUPPORT_URL` has no actual destination configured yet; the support page makes this explicit until deployment configuration is supplied.
- Verified the configured Clerk development secret with a read-only instance request. A complete interactive account signup/signin has not yet been performed; production Clerk setup remains pending.

## Remaining capabilities

1. Complete WP-01: complete the early public deployment gate and rehearse migrations against isolated PostgreSQL.
2. WP-03: choose upstream abuse controls; configure the production support destination; deploy and verify the scheduled cleanup job.
3. WP-04: accessibility/mobile review, complete CI and acceptance evidence, migration/recovery rehearsal, and release decision.

## Requirements and design references

- Foundation and schema support the approved Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel design in the TRD; Project and ApiKey fields and indexes follow TRD §9.
- PRD FR-01 is partially implemented (landing, account entry points, project create/list/detail, and public API guide; public deployment remains). FR-02 account authentication/session and project ownership checks are implemented. FR-04/FR-05 key issuance and revoke/replace flows are implemented. FR-06/FR-07 event submission and attributable outcomes, FR-08/FR-09 30-day activity views and reads, FR-10 API guidance, and the TRD-approved retention cleanup implementation are complete. NFR-08 demo/privacy content is implemented; public support destination, deployed cleanup evidence, and other release NFR evidence remain open.
- TRD SP-01 uses Clerk development credentials locally. Production Clerk domain, credentials, and fresh-account verification remain deployment work.

## Approved decisions

- D-01: Clerk production authentication on an owned domain.
- D-02: exact 30-day visible history with daily physical cleanup and at most 25-hour normal-operation lag.
- D-03: approved validation, rolling admission, engineering, and recovery baseline.

## Known issues and release blockers

- No production domain, production Clerk configuration, Vercel deployment, abuse-control decision, support destination, budget, or recovery evidence has been configured. `SUPPORT_URL`, production `CRON_SECRET`, and an actual scheduled invocation remain unverified.
- The configured database is the Neon `production` branch. The user reports applying the fourth migration (`20261004100000_retention_maintenance`); this runtime's read-only Prisma status check failed with a generic schema-engine error. Authenticated project/key mutations, event ingestion, and cleanup still need end-to-end verification in a disposable development/preview database and fresh Clerk account; production was not used for application-flow verification.
- Docker CLI is installed but its daemon is unavailable in this workspace.
- Deployment target remains the TRD-approved Vercel path. The user asked whether Docker could be the deployment target, but has not specified local development use versus replacing Vercel; no deployment-plan change has been made.
- `.env.example` contains placeholders only. Production authentication and deployment integration remain unverified.
- `prisma.config.ts` loads `.env.local` through `@next/env`, so Prisma CLI commands use the configured direct `MIGRATION_DATABASE_URL`.
- The input TRD contains pre-existing trailing whitespace, reported by `git diff --cached --check` when the source document was first committed.

## Last implementation checkpoint

- `28010c7` — `feat: add Clerk account authentication`
- `7eca280` — `feat: add owner-scoped project workspace`
- `db87061` — `feat: add project API key lifecycle`
- `96d0fd1` — `feat: add public event ingestion`
- `a3f3cef` — `feat: add public event API guide`
- `02f9765` — `feat: add project activity dashboard`
- `b1e214e` — `feat: add scheduled retention cleanup`
- `b007e04` — `feat: add privacy and support pages`
