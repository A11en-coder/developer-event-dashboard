import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type {
  ProjectCursor,
  ProjectDetail,
  ProjectPage,
  ProjectSummary,
} from "@/lib/project-types";
import { getPrisma } from "@/server/db";
import { admitManagementOperation } from "@/server/management-limits";

const projectIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseProjectName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const name = value.trim();
  const length = Array.from(name).length;

  return length >= 1 && length <= 80 ? name : null;
}

export function isProjectId(value: string): boolean {
  return projectIdPattern.test(value);
}

function encodeCursor(cursor: ProjectCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function parseProjectCursor(value: string): ProjectCursor | null {
  if (value.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const cursor = parsed as Record<string, unknown>;
    if (
      cursor.endpoint !== "projects" ||
      typeof cursor.snapshotAt !== "string" ||
      typeof cursor.afterCreatedAt !== "string" ||
      typeof cursor.afterId !== "string" ||
      !isProjectId(cursor.afterId)
    ) {
      return null;
    }

    const snapshotAt = new Date(cursor.snapshotAt);
    const afterCreatedAt = new Date(cursor.afterCreatedAt);
    if (
      !Number.isFinite(snapshotAt.getTime()) ||
      !Number.isFinite(afterCreatedAt.getTime()) ||
      snapshotAt.toISOString() !== cursor.snapshotAt ||
      afterCreatedAt.toISOString() !== cursor.afterCreatedAt ||
      afterCreatedAt > snapshotAt
    ) {
      return null;
    }

    return cursor as ProjectCursor;
  } catch {
    return null;
  }
}

// This function lists the projects owned by a specific user, with pagination support.
export async function listOwnedProjects(
  ownerClerkUserId: string,
  limit: number,
  cursor: ProjectCursor | null,
): Promise<ProjectPage> {
  const prisma = getPrisma();
  const databaseNow = (
    await prisma.$queryRaw<{ databaseNow: Date }[]>`
      SELECT CURRENT_TIMESTAMP AS "databaseNow"
    `
  )[0].databaseNow;
  const snapshotAt = cursor ? new Date(cursor.snapshotAt) : databaseNow;
  if (snapshotAt > databaseNow) {
    throw new InvalidProjectCursorError();
  }

  const afterClause: Prisma.ProjectWhereInput = cursor
    ? {
        OR: [
          { createdAt: { lt: new Date(cursor.afterCreatedAt) } },
          {
            createdAt: new Date(cursor.afterCreatedAt),
            id: { lt: cursor.afterId },
          },
        ],
      }
    : {};

  const rows = await prisma.project.findMany({
    where: {
      ownerClerkUserId,
      createdAt: { lte: snapshotAt },
      ...afterClause,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    select: { id: true, name: true, createdAt: true },
  });

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const last = pageRows.at(-1);

  return {
    items: pageRows.map((project) => ({
      id: project.id,
      name: project.name,
      createdAt: project.createdAt.toISOString(),
    })),
    nextCursor:
      hasMore && last
        ? encodeCursor({
            endpoint: "projects",
            snapshotAt: snapshotAt.toISOString(),
            afterCreatedAt: last.createdAt.toISOString(),
            afterId: last.id,
          })
        : null,
  };
}

export class InvalidProjectCursorError extends Error {
  constructor() {
    super("Project cursor snapshot is in the future.");
    this.name = "InvalidProjectCursorError";
  }
}

export async function createOwnedProject(
  ownerClerkUserId: string,
  name: string,
): Promise<ProjectSummary> {
  const project = await getPrisma().project.create({
    data: { ownerClerkUserId, name },
    select: { id: true, name: true, createdAt: true },
  });

  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
  };
}

export async function getOwnedProject(
  ownerClerkUserId: string,
  id: string,
): Promise<ProjectDetail | null> {
  if (!isProjectId(id)) {
    return null;
  }

  const project = await getPrisma().project.findFirst({
    where: { id, ownerClerkUserId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      keyVersion: true,
      apiKeys: {
        where: { revokedAt: null },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 1,
        select: { id: true, displayHint: true, createdAt: true },
      },
    },
  });

  if (!project) {
    return null;
  }

  const activeKey = project.apiKeys[0];
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
    keyVersion: project.keyVersion,
    activeKey: activeKey
      ? {
          id: activeKey.id,
          displayHint: activeKey.displayHint,
          createdAt: activeKey.createdAt.toISOString(),
        }
      : null,
  };
}

export async function admitProjectCreation(ownerClerkUserId: string) {
  return admitManagementOperation(getPrisma(), ownerClerkUserId, "PROJECT_CREATE");
}
