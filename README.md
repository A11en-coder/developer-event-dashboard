# Developer Event Dashboard

The approved project uses Next.js, Clerk, Prisma, Neon PostgreSQL, and Vercel. Product behavior and architecture are specified in [the PRD](docs/Developer_Event_Dashboard_PRD.md) and [the TRD](docs/Developer_Event_Dashboard_TRD.md).

## Local prerequisites

- Node.js 24.16.0 (see `.nvmrc`)
- npm 11.13.0

Install the locked dependencies and start the app:

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>.

Copy `.env.example` to `.env.local` when configuring local services. Replace placeholders only with credentials for isolated development resources. `.env.local` is ignored by Git; never commit provider keys or database URLs. The starter app does not need credentials to build.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server |
| `npm run lint` | Check source with ESLint |
| `npm run typecheck` | Run the TypeScript checker |
| `npm run build` | Create a production build |
| `npm run db:generate` | Generate the Prisma client from `prisma/schema.prisma` |

Prisma runtime connections use `DATABASE_URL`; Prisma migration commands use `MIGRATION_DATABASE_URL`. They are intentionally separate so runtime credentials do not need migration privileges. Reviewed migration files live under `prisma/migrations`; validate them against an isolated PostgreSQL database before applying them to any shared environment. Never run development or destructive schema commands against production.

See [the TRD](docs/Developer_Event_Dashboard_TRD.md) before configuring shared or production resources.
