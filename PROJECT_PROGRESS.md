# Project Progress

## Project

Developer Event Dashboard. The approved PRD and TRD are in `docs/`. The workspace now contains the initial Next.js application scaffold.

## Current phase and capability

- Phase: WP-01, project foundation and early public gate.
- Completed capabilities: runtime foundation/local runtime compatibility; Project and ApiKey data model with initial migration.
- TRD SP-05: pinned toolchain, lockfile install, Prisma client generation, schema validation, and production build verified locally. PostgreSQL migration application and preview connection/transaction smoke check remain open.

## Completed

- Initialized the Git repository and committed the approved PRD/TRD alongside the starter application.
- Pinned Node 24.16.0, npm 11.13.0, Next.js 16.3.8, Clerk 7.9.9, and Prisma 7.10.0 with the PostgreSQL driver adapter.
- Added environment placeholders with separate runtime and migration database URLs; no real credentials are stored.
- Added a minimal PostgreSQL Prisma schema and generated client successfully.
- Verified clean dependency installation, Prisma generation, ESLint, TypeScript, and production build.
- Added Project and ApiKey models with UUIDs, Clerk ownership ID, key hash/display metadata, version and lifecycle timestamps, ordered indexes, project cascade relation, unique composite key, and partial unique active-key index.
- Generated and reviewed the initial SQL migration. It has not been applied to a live or disposable PostgreSQL database.

## Remaining capabilities

1. Complete WP-01: apply/rehearse the schema on isolated PostgreSQL, public landing/API guide orientation, Clerk session and project ownership flow, and early public deployment gate.
2. WP-02: key issuance/revocation services, event validation and ingestion, distributed rolling limit, and initial dashboard read.
3. WP-03: retained event/request views, attributable rejections, key management UI, retention cleanup, privacy/support content, and abuse controls.
4. WP-04: accessibility/mobile review, complete CI and acceptance evidence, migration/recovery rehearsal, and release decision.

## Requirements and design references

- Foundation and schema support the approved Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel design in the TRD; Project and ApiKey fields and indexes follow TRD §9.
- Product behavior remains pending: PRD FR-01–FR-12 and NFR-01–NFR-09 have not been claimed complete by this foundation capability.
- Current dependency is isolated development/provider configuration. Local builds do not require service credentials.

## Approved decisions

- D-01: Clerk production authentication on an owned domain.
- D-02: exact 30-day visible history with daily physical cleanup and at most 25-hour normal-operation lag.
- D-03: approved validation, rolling admission, engineering, and recovery baseline.

## Known issues and release blockers

- No production domain, Clerk production configuration, Neon resources, Vercel deployment, abuse-control decision, support destination, budget, or recovery evidence has been configured.
- Docker CLI is installed but its daemon is unavailable in this workspace; no database connection is configured, so the migration has only been statically reviewed and Prisma-generated.
- `.env.example` contains placeholders only. Public authentication and database integration remain unverified.
- The initial page is the unmodified Next.js starter page; product UI is a later capability.
- The input TRD contains pre-existing trailing whitespace, reported by `git diff --cached --check` when the source document was first committed.

## Last implementation checkpoint

- `246fa99` — `feat: add project and API key data model`
