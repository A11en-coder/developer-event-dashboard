# Migration and recovery rehearsal

## Scope

Performed 2026-10-04 against a temporary PostgreSQL 18.6 cluster listening only on `127.0.0.1:55432`. The cluster and all databases were disposable and separate from the configured Neon production branch. The application state under rehearsal was commit `bf2fe6d`; Prisma CLI version was 7.10.0.

This evidence covers migration replay, an upgrade from the schema immediately before the retention migration, database dump/restore, and retention behavior after restore. It does not verify Neon point-in-time recovery, provider backup retention, production recovery point/time, or the production deployment.

## Results

| Scenario | Procedure | Result |
| --- | --- | --- |
| Fresh database | Created an empty database, ran `prisma migrate deploy`, then `prisma migrate status`. | Passed. All four migrations applied in order and the database reported up to date. |
| Prior-schema upgrade | Used the schema and first three migrations from the commit before the retention migration. Seeded one project, one API key, two request records, and one management bucket. Ran the current migration deploy and status commands. | Passed. Only `20261004100000_retention_maintenance` applied; all four migrations were then up to date. Both request records remained, and `MaintenanceState` existed. |
| Backup restore | Created a custom-format `pg_dump` of the upgraded fixture database, restored it into a separate empty database with `pg_restore --exit-on-error`, and checked the contents. | Passed. The restore contained one project, one API key, two request records, one management bucket, and the `MaintenanceState` table. |
| Post-restore cleanup | In the restored database, the fixture contained one request older than 30 days, one current accepted event, and one management bucket older than 25 hours. Called the compiled retention route handler with the temporary rehearsal bearer secret. | Passed. Handler returned HTTP 200, deleted one expired request and one old management bucket, retained the current event, and recorded `lastDeletedCount = 2`. |
| Authorization and repeat run | Called the handler with an incorrect bearer secret, then repeated cleanup with the correct temporary secret. | Passed. Invalid authorization returned HTTP 401. The repeat returned HTTP 200 with zero request records and zero management buckets deleted. |

## Environment limits

The normal local HTTP request traverses Clerk middleware. That middleware could not complete in this network-restricted environment, so the retention handler was invoked directly from the compiled Next.js route module for the cleanup checks. This verifies the handler and database work, but does not verify the full middleware-to-route HTTP path. No production credentials or production database were used by the rehearsal.

The local dump/restore proves the application schema and fixture can be restored into a separate PostgreSQL database. Before release, separately verify the selected Neon plan's recovery features and record a provider-level recovery point and recovery duration, as required by TRD §17.
