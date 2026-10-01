# Project Progress

## Project

Developer Event Dashboard. The approved PRD and TRD are in `docs/`. The workspace now contains the initial Next.js application scaffold.

## Current phase and capability

- Phase: WP-01, project foundation and early public gate.
- Completed capability: runtime foundation and local runtime compatibility.
- TRD SP-05: pinned toolchain, lockfile install, Prisma client generation, and production build verified locally. Preview database connection and transaction smoke check remain open.

## Completed

- Initialized the Git repository and committed the approved PRD/TRD alongside the starter application.
- Pinned Node 24.16.0, npm 11.13.0, Next.js 16.3.8, Clerk 7.9.9, and Prisma 7.10.0 with the PostgreSQL driver adapter.
- Added environment placeholders with separate runtime and migration database URLs; no real credentials are stored.
- Added a minimal PostgreSQL Prisma schema and generated client successfully.
- Verified clean dependency installation, Prisma generation, ESLint, TypeScript, and production build.

## Remaining capabilities

1. Complete WP-01: database schema foundation, public landing/API guide orientation, Clerk session and project ownership flow, and early public deployment gate.
2. WP-02: API key lifecycle, event validation and ingestion, distributed rolling limit, and initial dashboard read.
3. WP-03: retained event/request views, attributable rejections, key management UI, retention cleanup, privacy/support content, and abuse controls.
4. WP-04: accessibility/mobile review, complete CI and acceptance evidence, migration/recovery rehearsal, and release decision.

## Requirements and design references

- Foundation supports the approved Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel design in the TRD.
- Product behavior remains pending: PRD FR-01–FR-12 and NFR-01–NFR-09 have not been claimed complete by this foundation capability.
- Current dependency is isolated development/provider configuration. Local builds do not require service credentials.

## Approved decisions

- D-01: Clerk production authentication on an owned domain.
- D-02: exact 30-day visible history with daily physical cleanup and at most 25-hour normal-operation lag.
- D-03: approved validation, rolling admission, engineering, and recovery baseline.

## Known issues and release blockers

- No production domain, Clerk production configuration, Neon resources, Vercel deployment, abuse-control decision, support destination, budget, or recovery evidence has been configured.
- `.env.example` contains placeholders only. Public authentication and database integration remain unverified.
- The initial page is the unmodified Next.js starter page; product UI is a later capability.
- The input TRD contains pre-existing trailing whitespace, reported by `git diff --cached --check` when the source document was first committed.

## Last implementation checkpoint

- `d3903f2` — `chore: establish project runtime foundation`
