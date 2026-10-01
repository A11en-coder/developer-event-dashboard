-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ownerClerkUserId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keyVersion" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "secretHash" CHAR(64) NOT NULL,
    "displayHint" VARCHAR(48) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_ownerClerkUserId_createdAt_id_idx" ON "Project"("ownerClerkUserId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "ApiKey_projectId_createdAt_id_idx" ON "ApiKey"("projectId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_id_projectId_key" ON "ApiKey"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_projectId_key" ON "ApiKey"("projectId") WHERE ("revokedAt" IS NULL);

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
