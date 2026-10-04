import "server-only";

import { getPrisma } from "@/server/db";

const RETENTION_DAYS = 30;
const MANAGEMENT_BUCKET_HOURS = 25;
const DELETE_BATCH_SIZE = 1_000;
const MAX_REQUEST_RECORDS_PER_RUN = 10_000;

export type RetentionCleanupResult =
  | { status: "already-running" }
  | {
      status: "completed";
      cutoffAt: string;
      completedAt: string;
      deletedRequestRecords: number;
      deletedManagementBuckets: number;
    }
  | {
      status: "backlog";
      cutoffAt: string;
      deletedRequestRecords: number;
      deletedManagementBuckets: number;
      remainingRequestRecords: number;
    };

export async function runRetentionCleanup(): Promise<RetentionCleanupResult> {
  return getPrisma().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('lock_timeout', '2000ms', true)`;
      await tx.$queryRaw`SELECT set_config('statement_timeout', '3000ms', true)`;

      const lock = await tx.$queryRaw<Array<{ acquired: boolean }>>`
        SELECT pg_try_advisory_xact_lock(1953654114, 1918988593) AS "acquired"
      `;
      if (!lock[0]?.acquired) {
        return { status: "already-running" };
      }

      const clock = await tx.$queryRaw<Array<{ now: Date }>>`
        SELECT transaction_timestamp() AS "now"
      `;
      const now = clock[0]?.now;
      if (!now) {
        throw new Error("Could not sample database time for retention cleanup.");
      }

      const cutoff = new Date(
        now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      let deletedRequestRecords = 0;

      while (deletedRequestRecords < MAX_REQUEST_RECORDS_PER_RUN) {
        const deleted = await tx.$executeRaw`
          WITH batch AS (
            SELECT "id"
            FROM "RequestRecord"
            WHERE "receivedAt" <= ${cutoff}
            ORDER BY "receivedAt" ASC, "id" ASC
            LIMIT ${DELETE_BATCH_SIZE}
            FOR UPDATE SKIP LOCKED
          )
          DELETE FROM "RequestRecord" AS request_record
          USING batch
          WHERE request_record."id" = batch."id"
        `;

        deletedRequestRecords += deleted;
        if (deleted < DELETE_BATCH_SIZE) {
          break;
        }
      }

      const expired = await tx.requestRecord.count({
        where: { receivedAt: { lte: cutoff } },
      });
      const bucketCutoff = new Date(
        now.getTime() - MANAGEMENT_BUCKET_HOURS * 60 * 60 * 1000,
      );
      const deletedManagementBuckets = await tx.managementBucket
        .deleteMany({ where: { minuteStart: { lt: bucketCutoff } } })
        .then((result) => result.count);

      if (expired > 0) {
        return {
          status: "backlog",
          cutoffAt: cutoff.toISOString(),
          deletedRequestRecords,
          deletedManagementBuckets,
          remainingRequestRecords: expired,
        };
      }

      const completionClock = await tx.$queryRaw<Array<{ completedAt: Date }>>`
        SELECT clock_timestamp() AS "completedAt"
      `;
      const completedAt = completionClock[0]?.completedAt;
      if (!completedAt) {
        throw new Error("Could not sample completion time for retention cleanup.");
      }

      await tx.maintenanceState.upsert({
        where: { name: "retention" },
        create: {
          name: "retention",
          lastSuccessAt: completedAt,
          lastDeletedCount: BigInt(
            deletedRequestRecords + deletedManagementBuckets,
          ),
        },
        update: {
          lastSuccessAt: completedAt,
          lastDeletedCount: BigInt(
            deletedRequestRecords + deletedManagementBuckets,
          ),
        },
      });

      return {
        status: "completed",
        cutoffAt: cutoff.toISOString(),
        completedAt: completedAt.toISOString(),
        deletedRequestRecords,
        deletedManagementBuckets,
      };
    },
    { maxWait: 2_000, timeout: 5_000 },
  );
}
