import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ActivitySnapshot, ActivityWindow } from "@/lib/activity-types";
import { getPrisma } from "@/server/db";
import { isProjectId } from "@/server/projects";

const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export type ActivityEndpoint = "event-counts" | "events" | "requests";

export type ActivityCursor = {
  endpoint: ActivityEndpoint;
  projectId: string;
  snapshotAt: string;
  afterName?: string;
  afterReceivedAt?: string;
  afterId?: string;
};

export type ActivityPage<T> = {
  window: ActivityWindow;
  items: T[];
  nextCursor: string | null;
};

export class InvalidActivityCursorError extends Error {
  constructor() {
    super("Activity cursor is invalid or outside the retained window.");
    this.name = "InvalidActivityCursorError";
  }
}

export function encodeActivityCursor(cursor: ActivityCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function parseActivityCursor(
  value: string,
  endpoint: ActivityEndpoint,
  projectId: string,
): ActivityCursor | null {
  if (
    value.length > 2048 ||
    !/^[A-Za-z0-9_-]+$/.test(value) ||
    !isProjectId(projectId)
  ) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url");
    if (decoded.toString("base64url") !== value) {
      return null;
    }

    const parsed: unknown = JSON.parse(decoded.toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const cursor = parsed as Record<string, unknown>;
    if (
      cursor.endpoint !== endpoint ||
      cursor.projectId !== projectId ||
      typeof cursor.snapshotAt !== "string"
    ) {
      return null;
    }

    if (endpoint === "event-counts") {
      if (
        Object.keys(cursor).length !== 4 ||
        typeof cursor.afterName !== "string" ||
        !EVENT_NAME_PATTERN.test(cursor.afterName)
      ) {
        return null;
      }
    } else if (
      Object.keys(cursor).length !== 5 ||
      typeof cursor.afterReceivedAt !== "string" ||
      typeof cursor.afterId !== "string" ||
      !isProjectId(cursor.afterId)
    ) {
      return null;
    }

    const snapshotAt = parseCanonicalDate(cursor.snapshotAt);
    if (!snapshotAt) {
      return null;
    }

    if (endpoint !== "event-counts") {
      const afterReceivedAt = parseCanonicalDate(
        cursor.afterReceivedAt as string,
      );
      if (!afterReceivedAt || afterReceivedAt > snapshotAt) {
        return null;
      }
    }

    return cursor as ActivityCursor;
  } catch {
    return null;
  }
}

function parseCanonicalDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString() === value
    ? date
    : null;
}

function makeWindow(snapshotAt: Date): ActivityWindow {
  return {
    from: new Date(snapshotAt.getTime() - RETENTION_MS).toISOString(),
    to: snapshotAt.toISOString(),
    days: RETENTION_DAYS,
  };
}

async function getReadContext(
  tx: Prisma.TransactionClient,
  ownerClerkUserId: string,
  projectId: string,
  cursor: ActivityCursor | null,
): Promise<{ window: ActivityWindow; snapshotAt: Date } | null> {
  const project = await tx.project.findFirst({
    where: { id: projectId, ownerClerkUserId },
    select: { id: true },
  });
  if (!project) {
    return null;
  }

  const clock = await tx.$queryRaw<Array<{ now: Date }>>`
    SELECT transaction_timestamp() AS "now"
  `;
  const now = clock[0]?.now;
  if (!now) {
    throw new Error("Could not sample database time for project activity.");
  }

  const snapshotAt = cursor ? new Date(cursor.snapshotAt) : now;
  const cutoff = now.getTime() - RETENTION_MS;
  if (
    snapshotAt.getTime() > now.getTime() ||
    snapshotAt.getTime() < cutoff
  ) {
    throw new InvalidActivityCursorError();
  }

  return { window: makeWindow(snapshotAt), snapshotAt };
}

function retainedWhere(
  projectId: string,
  from: string,
  to: Date,
): Prisma.RequestRecordWhereInput {
  return {
    projectId,
    receivedAt: { gt: new Date(from), lte: to },
  };
}

export async function getOwnedActivitySnapshot(
  ownerClerkUserId: string,
  projectId: string,
): Promise<ActivitySnapshot | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getPrisma().$transaction(
    async (tx) => {
      const context = await getReadContext(tx, ownerClerkUserId, projectId, null);
      if (!context) {
        return null;
      }

      const where = retainedWhere(projectId, context.window.from, context.snapshotAt);
      const total = await tx.requestRecord.count({ where });
      const accepted = await tx.requestRecord.count({
        where: { ...where, outcome: "ACCEPTED" },
      });
      const grouped = await tx.requestRecord.groupBy({
        by: ["eventName"],
        where: {
          ...where,
          outcome: "ACCEPTED",
          eventName: { not: null },
        },
        _count: { _all: true },
        orderBy: [{ _count: { eventName: "desc" } }, { eventName: "asc" }],
        take: 5,
      });
      const events = await tx.requestRecord.findMany({
        where: { ...where, outcome: "ACCEPTED" },
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: 5,
        select: { id: true, eventName: true, receivedAt: true },
      });
      const requests = await tx.requestRecord.findMany({
        where,
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: 10,
        select: {
          id: true,
          receivedAt: true,
          outcome: true,
          httpStatus: true,
          errorCode: true,
        },
      });

      return {
        window: context.window,
        requests: { total, accepted, rejected: total - accepted },
        events: { total: accepted },
        eventCounts: grouped.flatMap((item) =>
          item.eventName
            ? [{ name: item.eventName, count: item._count._all }]
            : [],
        ),
        recentEvents: events.flatMap((item) =>
          item.eventName
            ? [
                {
                  id: item.id,
                  name: item.eventName,
                  receivedAt: item.receivedAt.toISOString(),
                },
              ]
            : [],
        ),
        recentRequests: requests.map((item) => ({
          id: item.id,
          receivedAt: item.receivedAt.toISOString(),
          outcome: item.outcome,
          httpStatus: item.httpStatus,
          errorCode: item.errorCode,
        })),
      };
    },
    { maxWait: 2_000, timeout: 5_000, isolationLevel: "RepeatableRead" },
  );
}

export async function getOwnedActivitySummary(
  ownerClerkUserId: string,
  projectId: string,
): Promise<Omit<ActivitySnapshot, "eventCounts" | "recentEvents" | "recentRequests"> | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getPrisma().$transaction(
    async (tx) => {
      const context = await getReadContext(tx, ownerClerkUserId, projectId, null);
      if (!context) {
        return null;
      }

      const where = retainedWhere(projectId, context.window.from, context.snapshotAt);
      const [total, accepted] = await Promise.all([
        tx.requestRecord.count({ where }),
        tx.requestRecord.count({ where: { ...where, outcome: "ACCEPTED" } }),
      ]);

      return {
        window: context.window,
        requests: { total, accepted, rejected: total - accepted },
        events: { total: accepted },
      };
    },
    { maxWait: 2_000, timeout: 5_000, isolationLevel: "RepeatableRead" },
  );
}

export async function listOwnedEventCounts(
  ownerClerkUserId: string,
  projectId: string,
  limit: number,
  cursor: ActivityCursor | null,
): Promise<ActivityPage<ActivitySnapshot["eventCounts"][number]> | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getPrisma().$transaction(
    async (tx) => {
      const context = await getReadContext(tx, ownerClerkUserId, projectId, cursor);
      if (!context) {
        return null;
      }

      const rows = await tx.requestRecord.groupBy({
        by: ["eventName"],
        where: {
          ...retainedWhere(projectId, context.window.from, context.snapshotAt),
          outcome: "ACCEPTED",
          eventName: { not: null, ...(cursor ? { gt: cursor.afterName } : {}) },
        },
        _count: { _all: true },
        orderBy: { eventName: "asc" },
        take: limit + 1,
      });
      const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
      const last = pageRows.at(-1);

      return {
        window: context.window,
        items: pageRows.flatMap((item) =>
          item.eventName
            ? [{ name: item.eventName, count: item._count._all }]
            : [],
        ),
        nextCursor:
          rows.length > limit && last?.eventName
            ? encodeActivityCursor({
                endpoint: "event-counts",
                projectId,
                snapshotAt: context.snapshotAt.toISOString(),
                afterName: last.eventName,
              })
            : null,
      };
    },
    { maxWait: 2_000, timeout: 5_000, isolationLevel: "RepeatableRead" },
  );
}

export async function listOwnedRecentEvents(
  ownerClerkUserId: string,
  projectId: string,
  limit: number,
  cursor: ActivityCursor | null,
): Promise<ActivityPage<{ id: string; name: string; receivedAt: string }> | null> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getPrisma().$transaction(
    async (tx) => {
      const context = await getReadContext(tx, ownerClerkUserId, projectId, cursor);
      if (!context) {
        return null;
      }

      const after = cursor
        ? {
            OR: [
              { receivedAt: { lt: new Date(cursor.afterReceivedAt!) } },
              {
                receivedAt: new Date(cursor.afterReceivedAt!),
                id: { lt: cursor.afterId! },
              },
            ],
          }
        : {};
      const rows = await tx.requestRecord.findMany({
        where: {
          ...retainedWhere(projectId, context.window.from, context.snapshotAt),
          outcome: "ACCEPTED",
          eventName: { not: null },
          ...after,
        },
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: { id: true, eventName: true, receivedAt: true },
      });
      const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
      const last = pageRows.at(-1);

      return {
        window: context.window,
        items: pageRows.flatMap((item) =>
          item.eventName
            ? [
                {
                  id: item.id,
                  name: item.eventName,
                  receivedAt: item.receivedAt.toISOString(),
                },
              ]
            : [],
        ),
        nextCursor:
          rows.length > limit && last
            ? encodeActivityCursor({
                endpoint: "events",
                projectId,
                snapshotAt: context.snapshotAt.toISOString(),
                afterReceivedAt: last.receivedAt.toISOString(),
                afterId: last.id,
              })
            : null,
      };
    },
    { maxWait: 2_000, timeout: 5_000, isolationLevel: "RepeatableRead" },
  );
}

export async function listOwnedRecentRequests(
  ownerClerkUserId: string,
  projectId: string,
  limit: number,
  cursor: ActivityCursor | null,
): Promise<
  ActivityPage<{
    id: string;
    receivedAt: string;
    outcome: string;
    httpStatus: number;
    errorCode: string | null;
  }> | null
> {
  if (!isProjectId(projectId)) {
    return null;
  }

  return getPrisma().$transaction(
    async (tx) => {
      const context = await getReadContext(tx, ownerClerkUserId, projectId, cursor);
      if (!context) {
        return null;
      }

      const after = cursor
        ? {
            OR: [
              { receivedAt: { lt: new Date(cursor.afterReceivedAt!) } },
              {
                receivedAt: new Date(cursor.afterReceivedAt!),
                id: { lt: cursor.afterId! },
              },
            ],
          }
        : {};
      const rows = await tx.requestRecord.findMany({
        where: {
          ...retainedWhere(projectId, context.window.from, context.snapshotAt),
          ...after,
        },
        orderBy: [{ receivedAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        select: {
          id: true,
          receivedAt: true,
          outcome: true,
          httpStatus: true,
          errorCode: true,
        },
      });
      const pageRows = rows.length > limit ? rows.slice(0, limit) : rows;
      const last = pageRows.at(-1);

      return {
        window: context.window,
        items: pageRows.map((item) => ({
          id: item.id,
          receivedAt: item.receivedAt.toISOString(),
          outcome: item.outcome,
          httpStatus: item.httpStatus,
          errorCode: item.errorCode,
        })),
        nextCursor:
          rows.length > limit && last
            ? encodeActivityCursor({
                endpoint: "requests",
                projectId,
                snapshotAt: context.snapshotAt.toISOString(),
                afterReceivedAt: last.receivedAt.toISOString(),
                afterId: last.id,
              })
            : null,
      };
    },
    { maxWait: 2_000, timeout: 5_000, isolationLevel: "RepeatableRead" },
  );
}
