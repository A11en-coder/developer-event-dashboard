-- CreateTable
CREATE TABLE "MaintenanceState" (
    "name" TEXT NOT NULL,
    "lastSuccessAt" TIMESTAMPTZ(6),
    "lastDeletedCount" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "MaintenanceState_pkey" PRIMARY KEY ("name")
);
