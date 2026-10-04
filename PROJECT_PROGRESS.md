# Project Progress

## Project

Developer Event Dashboard. The approved PRD and TRD are in `docs/`. The workspace now contains the initial Next.js application scaffold.

## Current phase and capability

- Phase: WP-04, release and recovery evidence.
- Last completed implementation checkpoint: GitHub Actions CI baseline and isolated PostgreSQL migration/recovery rehearsal. The user reports the hosted application validation passed. The user also confirmed actual 200% zoom and keyboard navigation work and reports the database schema is up to date. Provider-level recovery evidence and remaining release acceptance work are open.
- Completed capabilities: runtime foundation/local runtime compatibility; Project and ApiKey data model and migrations; Clerk account authentication and public landing page; owner-scoped project workspace; API-key issuance, revocation, and replacement; public event ingestion with attributable outcomes and project-wide rolling admission; public API guide; owner-scoped 30-day activity dashboard and read APIs; scheduled retention cleanup implementation; privacy and support pages; Vercel Firewall upstream abuse-control decision and staged log-only rule; accessibility and mobile improvements for project workspace controls.
- Current capability checkpoint: signed-in owners can create/list projects, view project details, issue one active key, revoke it, and replace it. Developers can submit named events through `POST /api/v1/events`; accepted events and attributable rejections are stored in `RequestRecord`. Project details show a consistent 30-day activity snapshot, with authenticated paginated read APIs. A `CRON_SECRET`-protected internal endpoint is scheduled daily at 02:00 UTC to purge expired history and old management buckets. Public privacy/support pages are available, with the contact channel supplied through `SUPPORT_URL`. The workspace now includes skip links, visible keyboard focus, 44px minimum controls, higher-contrast secondary text, accessible field/status feedback, narrow-screen text wrapping, and reduced-motion support.
- TRD SP-05: pinned toolchain, Prisma client generation, schema validation, ESLint, TypeScript, production build, and a GitHub Actions CI baseline are in place. The CI checks passed locally, including a clean `npm ci` in an isolated directory. The user reports that the GitHub-hosted application validation passed after adding `next typegen` before TypeScript checking. The user confirms the database schema is up to date. A read-only migration-status check against the configured Neon database in this Codex runtime failed with a schema-engine error, and a direct read-only ledger query failed with `EACCES`, so the user's production schema confirmation is recorded rather than independently rechecked here.

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
- Selected Vercel Firewall IP-based rate limiting as the shared upstream abuse control. Staged and reviewed `rule_event_ingestion_ip_rate_observation_EkZKJt` for `POST /api/v1/events`, with a 60-second fixed window, 600 requests per IP, and log-only over-limit action. The draft is not published, has not affected production, and has not observed production traffic.
- Improved the signed-in project list and detail experience for keyboard, assistive technology, and narrow viewports: skip links and focus indicators; at-least-44px interactive targets; form descriptions and operation status announcements; clearer secondary text; event-name wrapping; and reduced-motion handling. The project pages were reviewed at desktop and narrow browser widths; the user confirmed actual 200% zoom and keyboard operation. TypeScript, ESLint, production build, and `git diff --check` pass. No tests were added or run.
- Added a visible focus ring around Clerk's account-menu trigger on both the project list and project detail pages. The user confirmed the 200% zoom and keyboard flow work. The signed-in project list and detail page were reviewed in the browser; focus was visibly shown on the skip link and account menu, and the menu opened with the keyboard and closed with Escape. `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check` passed. The changes were committed as `3113be0`.
- Reviewed the public landing page at 360px, desktop, and a 720px CSS-width proxy for 200% zoom. Fixed narrow-screen navigation/overflow issues. Reproduced and fixed a project-details crash caused by combining `dateStyle`/`timeStyle` with `timeZoneName` in `Intl.DateTimeFormat`; the replacement formatter preserves an explicit UTC label. A signed-in browser session subsequently rendered the project list and detail page successfully. Current type check, lint, build, and diff checks pass. The user's migration status is recorded as confirmed; Codex's separate read-only DB checks are blocked by `EACCES`.
- Added `.github/workflows/ci.yml` to run dependency installation, Prisma client generation and schema validation, lint, Next.js route type generation, TypeScript checking, and a production build on pushes and pull requests. The job uses read-only repository permissions and CI-only placeholder environment values. YAML assertions and `git diff --check` passed; `npm ci`, Prisma generation/validation, lint, type checking, and production build passed locally. A clean `npm ci` also passed in an isolated directory. Commits `b1945ce` and `bf2fe6d` add the workflow and generated route types needed by `LayoutProps`; the user reports that the hosted validation passed.
- Rehearsed migration and recovery using a temporary PostgreSQL 18.6 cluster isolated from Neon production. A fresh database applied all four migrations; a prior-version database upgraded using only the new retention migration and preserved its fixture; a custom-format dump restored into a separate database; and the compiled retention handler deleted only the expired request and old management bucket, preserved the current event, rejected a wrong secret, and completed an idempotent repeat run. Evidence is recorded in `docs/operations/migration-recovery-rehearsal.md`. The local cluster and test databases were removed. This does not establish Neon provider recovery capability or a production recovery point/time.

## Remaining capabilities

1. Complete WP-01: complete the early public deployment gate and verify the selected Neon recovery option, recovery point, and recovery duration. The isolated PostgreSQL migration/recovery rehearsal is complete.
2. WP-03: publish the approved Vercel Firewall log-only rule when ready to observe deployed traffic; configure the production support destination; deploy and verify the scheduled cleanup job.
3. WP-04: complete remaining acceptance evidence, verify provider-level recovery, and make the release decision. The user reports the GitHub-hosted CI validation passed and has confirmed 200% zoom and keyboard operation.

## Requirements and design references

- Foundation and schema support the approved Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel design in the TRD; Project and ApiKey fields and indexes follow TRD §9.
- PRD FR-01 is partially implemented (landing, account entry points, project create/list/detail, and public API guide; public deployment remains). FR-02 account authentication/session and project ownership checks are implemented. FR-04/FR-05 key issuance and revoke/replace flows are implemented. FR-06/FR-07 event submission and attributable outcomes, FR-08/FR-09 30-day activity views and reads, FR-10 API guidance, and the TRD-approved retention cleanup implementation are complete. NFR-08 demo/privacy content is implemented; public support destination, deployed cleanup evidence, and other release NFR evidence remain open.
- TRD SP-01 uses Clerk development credentials locally. Production Clerk domain, credentials, and fresh-account verification remain deployment work.
- PRD NFR-06 and TRD T-12: workspace code improvements and public landing responsive checks are implemented. The activity timestamp formatter crash is fixed; typecheck/build passed, while ESLint stalled. Protected-page review, actual 200% zoom, and full keyboard-flow evidence remain open.

## Approved decisions

- D-01: Clerk production authentication on an owned domain.
- D-02: exact 30-day visible history with daily physical cleanup and at most 25-hour normal-operation lag.
- D-03: approved validation, rolling admission, engineering, and recovery baseline.
- D-04: use a Vercel Firewall IP-based rate-limit rule for `POST /api/v1/events` as the upstream shared abuse control. Begin with a 600 requests / 60 seconds per-IP threshold in log-only mode; do not enforce until real traffic is reviewed and enforcement is separately approved.

## Known issues and release blockers

- No production domain, production Clerk configuration, Vercel deployment, support destination, budget, or recovery evidence has been configured. `SUPPORT_URL`, production `CRON_SECRET`, and an actual scheduled invocation remain unverified. The reviewed abuse-control draft (`rule_event_ingestion_ip_rate_observation_EkZKJt`) is documented in `docs/operations/vercel-firewall.md`. The rule is not published, so it has not affected production or recorded traffic.
- The configured database is the Neon `production` branch. The user confirms the database schema is up to date. Codex's read-only Prisma status and PostgreSQL ledger checks could not reach it (`EACCES`). Authenticated project/key mutations, event ingestion, and cleanup still need end-to-end verification in a disposable development/preview database and fresh Clerk account; production was not used for application-flow verification.
- The isolated PostgreSQL migration/recovery rehearsal passed and is documented. The normal local HTTP path to the cleanup endpoint could not traverse Clerk middleware in this network-restricted runtime, so the compiled route handler was invoked directly. Neon provider backup/PITR capability and production recovery point/time remain unverified.
- Authenticated project-list and detail pages were successfully reviewed in the user's signed-in browser session. A later temporary Codex-launched server had no authenticated browser session and redirected `/projects` to sign-in as expected; no current product defect was established.
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
- `b466480` — `docs: record staged Vercel abuse-control rule`
- `74ec4d8` — `feat: improve workspace accessibility and mobile usability`
- `f890242` — `fix: address project review rendering issues`
- `3113be0` — `fix: show focus on workspace account controls`
- `b1945ce` — `ci: add GitHub Actions validation baseline`
- `bf2fe6d` — `ci: generate Next.js types before typecheck`
- `4b58344` — `docs: record isolated migration recovery rehearsal`
