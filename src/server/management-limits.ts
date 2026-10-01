import type { Prisma } from "@/generated/prisma/client";

type ManagementOperation = "PROJECT_CREATE" | "KEY_MUTATION";

export type ManagementAdmission = {
  admitted: boolean;
  retryAfterSeconds: number;
};

type RawQueryExecutor = Pick<Prisma.TransactionClient, "$queryRaw">;

export async function admitManagementOperation(
  database: RawQueryExecutor,
  ownerClerkUserId: string,
  operation: ManagementOperation,
): Promise<ManagementAdmission> {
  const rows = await database.$queryRaw<ManagementAdmission[]>`
    WITH clock AS (
      SELECT clock_timestamp() AS "instant"
    ),
    bucket AS (
      SELECT
        "instant",
        date_trunc('minute', "instant" AT TIME ZONE 'UTC') AT TIME ZONE 'UTC' AS "minuteStart"
      FROM clock
    ),
    admission AS (
      INSERT INTO "ManagementBucket" (
        "ownerClerkUserId",
        "operation",
        "minuteStart",
        "admittedCount"
      )
      SELECT
        ${ownerClerkUserId},
        ${operation}::"ManagementOperation",
        "minuteStart",
        1
      FROM bucket
      ON CONFLICT ("ownerClerkUserId", "operation", "minuteStart")
      DO UPDATE SET "admittedCount" = "ManagementBucket"."admittedCount" + 1
      WHERE "ManagementBucket"."admittedCount" < 10
      RETURNING "admittedCount"
    )
    SELECT
      EXISTS (SELECT 1 FROM admission) AS "admitted",
      GREATEST(
        1,
        CEIL(EXTRACT(EPOCH FROM (
          bucket."minuteStart" + INTERVAL '1 minute' - bucket."instant"
        )))::INTEGER
      ) AS "retryAfterSeconds"
    FROM bucket
  `;

  return rows[0];
}
