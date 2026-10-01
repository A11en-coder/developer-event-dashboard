-- CreateEnum
CREATE TYPE "RequestOutcome" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "RequestRecord" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "keyId" UUID NOT NULL,
    "receivedAt" TIMESTAMPTZ(6) NOT NULL,
    "quotaAt" TIMESTAMPTZ(6),
    "outcome" "RequestOutcome" NOT NULL,
    "httpStatus" SMALLINT NOT NULL,
    "errorCode" VARCHAR(40),
    "eventName" VARCHAR(64),

    CONSTRAINT "RequestRecord_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RequestRecord_outcome_check" CHECK (
      ("outcome" = 'ACCEPTED' AND "httpStatus" = 201 AND "eventName" IS NOT NULL AND "errorCode" IS NULL AND "quotaAt" IS NOT NULL)
      OR
      ("outcome" = 'REJECTED' AND "httpStatus" IN (400, 401, 413, 415, 429) AND "eventName" IS NULL AND "errorCode" IS NOT NULL)
    )
);

-- CreateIndex
CREATE INDEX "RequestRecord_projectId_receivedAt_id_all_idx"
ON "RequestRecord"("projectId", "receivedAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "RequestRecord_projectId_receivedAt_id_accepted_idx"
ON "RequestRecord"("projectId", "receivedAt" DESC, "id" DESC)
WHERE "outcome" = 'ACCEPTED';

-- CreateIndex
CREATE INDEX "RequestRecord_projectId_quotaAt_not_null_idx"
ON "RequestRecord"("projectId", "quotaAt")
WHERE "quotaAt" IS NOT NULL;

-- CreateIndex
CREATE INDEX "RequestRecord_receivedAt_id_idx"
ON "RequestRecord"("receivedAt", "id");

-- AddForeignKey
ALTER TABLE "RequestRecord"
ADD CONSTRAINT "RequestRecord_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRecord"
ADD CONSTRAINT "RequestRecord_keyId_projectId_fkey"
FOREIGN KEY ("keyId", "projectId") REFERENCES "ApiKey"("id", "projectId") ON DELETE CASCADE ON UPDATE CASCADE;
