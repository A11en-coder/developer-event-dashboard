import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db";
import { admitManagementOperation } from "@/server/management-limits";
import { isProjectId } from "@/server/projects";

export class OwnedProjectNotFoundError extends Error {
  constructor() {
    super("Project not found.");
    this.name = "OwnedProjectNotFoundError";
  }
}

export class ProjectKeyNotFoundError extends Error {
  constructor() {
    super("Project key not found.");
    this.name = "ProjectKeyNotFoundError";
  }
}

export class KeyStateChangedError extends Error {
  constructor() {
    super("The project key state changed.");
    this.name = "KeyStateChangedError";
  }
}

export type ProjectKeySummary = {
  id: string;
  displayHint: string;
  createdAt: string;
};

export type OneTimeProjectKey = ProjectKeySummary & {
  value: string;
};

export type KeyMutationResult<T> =
  | { ok: true; value: T }
  | { ok: false; retryAfterSeconds: number };

type LockedProject = {
  id: string;
  keyVersion: number;
};

async function lockOwnedProject(
  tx: Prisma.TransactionClient,
  ownerClerkUserId: string,
  projectId: string,
): Promise<LockedProject | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  const rows = await tx.$queryRaw<LockedProject[]>`
    SELECT "id", "keyVersion"
    FROM "Project"
    WHERE "id" = ${projectId}::uuid
      AND "ownerClerkUserId" = ${ownerClerkUserId}
    FOR UPDATE
  `;

  return rows[0] ?? null;
}

function assertExpectedVersion(project: LockedProject, expectedKeyVersion: number) {
  if (project.keyVersion !== expectedKeyVersion) {
    throw new KeyStateChangedError();
  }
}

async function incrementKeyVersion(
  tx: Prisma.TransactionClient,
  projectId: string,
): Promise<number> {
  const project = await tx.project.update({
    where: { id: projectId },
    data: { keyVersion: { increment: 1 } },
    select: { keyVersion: true },
  });

  return project.keyVersion;
}

async function createProjectKey(
  tx: Prisma.TransactionClient,
  projectId: string,
): Promise<OneTimeProjectKey> {
  const id = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  const displayHint = `ded_${id.slice(0, 8)}…${secret.slice(-4)}`;
  const secretHash = createHash("sha256").update(secret, "ascii").digest("hex");
  const created = await tx.apiKey.create({
    data: { id, projectId, secretHash, displayHint },
    select: { id: true, displayHint: true, createdAt: true },
  });

  return {
    id: created.id,
    value: `ded_${id}.${secret}`,
    displayHint: created.displayHint,
    createdAt: created.createdAt.toISOString(),
  };
}

export async function issueProjectKey(
  ownerClerkUserId: string,
  projectId: string,
  expectedKeyVersion: number,
): Promise<KeyMutationResult<{ key: OneTimeProjectKey; keyVersion: number }>> {
  return getPrisma().$transaction(async (tx) => {
    const project = await lockOwnedProject(tx, ownerClerkUserId, projectId);
    if (!project) {
      throw new OwnedProjectNotFoundError();
    }
    assertExpectedVersion(project, expectedKeyVersion);

    const activeKey = await tx.apiKey.findFirst({
      where: { projectId, revokedAt: null },
      select: { id: true },
    });
    if (activeKey) {
      throw new KeyStateChangedError();
    }

    const admission = await admitManagementOperation(
      tx,
      ownerClerkUserId,
      "KEY_MUTATION",
    );
    if (!admission.admitted) {
      return { ok: false, retryAfterSeconds: admission.retryAfterSeconds };
    }

    const key = await createProjectKey(tx, projectId);
    const keyVersion = await incrementKeyVersion(tx, projectId);
    return { ok: true, value: { key, keyVersion } };
  });
}

export async function revokeProjectKey(
  ownerClerkUserId: string,
  projectId: string,
  keyId: string,
  expectedKeyVersion: number,
): Promise<KeyMutationResult<{ keyVersion: number }>> {
  return getPrisma().$transaction(async (tx) => {
    const project = await lockOwnedProject(tx, ownerClerkUserId, projectId);
    if (!project) {
      throw new OwnedProjectNotFoundError();
    }
    assertExpectedVersion(project, expectedKeyVersion);

    if (!isProjectId(keyId)) {
      throw new ProjectKeyNotFoundError();
    }

    const key = await tx.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true, projectId: true, revokedAt: true },
    });
    if (!key || key.projectId !== projectId) {
      throw new ProjectKeyNotFoundError();
    }
    if (key.revokedAt) {
      throw new KeyStateChangedError();
    }

    const admission = await admitManagementOperation(
      tx,
      ownerClerkUserId,
      "KEY_MUTATION",
    );
    if (!admission.admitted) {
      return { ok: false, retryAfterSeconds: admission.retryAfterSeconds };
    }

    const revokedCount = await tx.$executeRaw`
      UPDATE "ApiKey"
      SET "revokedAt" = clock_timestamp()
      WHERE "id" = ${keyId}::uuid
        AND "projectId" = ${projectId}::uuid
        AND "revokedAt" IS NULL
    `;
    if (revokedCount !== 1) {
      throw new KeyStateChangedError();
    }

    const keyVersion = await incrementKeyVersion(tx, projectId);
    return { ok: true, value: { keyVersion } };
  });
}

export async function replaceProjectKey(
  ownerClerkUserId: string,
  projectId: string,
  expectedKeyVersion: number,
): Promise<KeyMutationResult<{ key: OneTimeProjectKey; keyVersion: number }>> {
  return getPrisma().$transaction(async (tx) => {
    const project = await lockOwnedProject(tx, ownerClerkUserId, projectId);
    if (!project) {
      throw new OwnedProjectNotFoundError();
    }
    assertExpectedVersion(project, expectedKeyVersion);

    const activeKey = await tx.apiKey.findFirst({
      where: { projectId, revokedAt: null },
      select: { id: true },
    });
    if (!activeKey) {
      throw new KeyStateChangedError();
    }

    const admission = await admitManagementOperation(
      tx,
      ownerClerkUserId,
      "KEY_MUTATION",
    );
    if (!admission.admitted) {
      return { ok: false, retryAfterSeconds: admission.retryAfterSeconds };
    }

    const revokedCount = await tx.$executeRaw`
      UPDATE "ApiKey"
      SET "revokedAt" = clock_timestamp()
      WHERE "id" = ${activeKey.id}::uuid
        AND "projectId" = ${projectId}::uuid
        AND "revokedAt" IS NULL
    `;
    if (revokedCount !== 1) {
      throw new KeyStateChangedError();
    }

    const key = await createProjectKey(tx, projectId);
    const keyVersion = await incrementKeyVersion(tx, projectId);
    return { ok: true, value: { key, keyVersion } };
  });
}
