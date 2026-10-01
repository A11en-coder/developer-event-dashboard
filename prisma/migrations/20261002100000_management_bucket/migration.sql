-- CreateEnum
CREATE TYPE "ManagementOperation" AS ENUM ('PROJECT_CREATE', 'KEY_MUTATION');

-- CreateTable
CREATE TABLE "ManagementBucket" (
    "ownerClerkUserId" TEXT NOT NULL,
    "operation" "ManagementOperation" NOT NULL,
    "minuteStart" TIMESTAMPTZ(6) NOT NULL,
    "admittedCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ManagementBucket_pkey" PRIMARY KEY ("ownerClerkUserId", "operation", "minuteStart"),
    CONSTRAINT "ManagementBucket_admittedCount_check" CHECK ("admittedCount" >= 0 AND "admittedCount" <= 10)
);

-- CreateIndex
CREATE INDEX "ManagementBucket_minuteStart_idx" ON "ManagementBucket"("minuteStart");
