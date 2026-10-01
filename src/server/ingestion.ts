import "server-only";

import {
  createHash,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/server/db";
import {
  readBoundedJsonBody,
  type JsonBodyFailureReason,
} from "@/server/api-request";

const EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;
const API_KEY_PATTERN =
  /^ded_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{43})$/;
const MAX_AUTHORIZATION_LENGTH = 256;
const MAX_BODY_BYTES = 1024;
const REQUEST_PATH = "/api/v1/events";

type SafeValidation =
  | { status: 201; errorCode: null; eventName: string }
  | { status: 400 | 413 | 415; errorCode: string; eventName: null };

type AuthenticatedKey = {
  id: string;
  projectId: string;
  secretHash: string;
};

type AdmissionClock = {
  now: Date;
  admittedCount: number;
  oldestAdmission: Date | null;
};

type StoredResult = {
  status: number;
  errorCode: string | null;
  eventName: string | null;
  receivedAt: Date;
  retryAfterSeconds?: number;
};

function jsonResponse(
  requestId: string,
  status: number,
  body: Record<string, unknown>,
  retryAfterSeconds?: number,
): Response {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Request-Id": requestId,
  });
  if (retryAfterSeconds !== undefined) {
    headers.set("Retry-After", String(retryAfterSeconds));
  }

  return new Response(JSON.stringify(body), { status, headers });
}

function errorResponse(
  requestId: string,
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
): Response {
  return jsonResponse(
    requestId,
    status,
    { error: { code, message }, requestId },
    retryAfterSeconds,
  );
}

function unauthorized(requestId: string): Response {
  return errorResponse(
    requestId,
    401,
    "UNAUTHORIZED",
    "A valid project API key is required.",
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
    value,
  );
}

function readCredential(request: Request):
  | { ok: true; keyId: string; secret: string }
  | { ok: false } {
  const authorization = request.headers.get("authorization");
  if (!authorization || authorization.length > MAX_AUTHORIZATION_LENGTH) {
    return { ok: false };
  }

  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  if (!match) {
    return { ok: false };
  }

  const keyMatch = API_KEY_PATTERN.exec(match[1]);
  if (!keyMatch || !isUuid(keyMatch[1])) {
    return { ok: false };
  }

  return { ok: true, keyId: keyMatch[1], secret: keyMatch[2] };
}

async function authenticateCredential(
  keyId: string,
  secret: string,
): Promise<AuthenticatedKey | null> {
  const key = await getPrisma().apiKey.findUnique({
    where: { id: keyId },
    select: { id: true, projectId: true, secretHash: true },
  });
  if (!key) {
    return null;
  }

  const expected = Buffer.from(key.secretHash, "hex");
  const actual = createHash("sha256").update(secret, "ascii").digest();
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return key;
}

function validatePayload(
  body: unknown,
  failure: JsonBodyFailureReason | null,
): SafeValidation {
  if (failure === "too-large") {
    return { status: 413, errorCode: "PAYLOAD_TOO_LARGE", eventName: null };
  }
  if (failure === "content-type") {
    return { status: 415, errorCode: "UNSUPPORTED_MEDIA_TYPE", eventName: null };
  }
  if (failure === "invalid") {
    return { status: 400, errorCode: "INVALID_JSON", eventName: null };
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { status: 400, errorCode: "INVALID_PAYLOAD", eventName: null };
  }

  const value = body as Record<string, unknown>;
  if (Object.keys(value).some((field) => field !== "name")) {
    return { status: 400, errorCode: "INVALID_PAYLOAD", eventName: null };
  }
  if (typeof value.name !== "string" || !EVENT_NAME_PATTERN.test(value.name)) {
    return { status: 400, errorCode: "INVALID_EVENT_NAME", eventName: null };
  }

  return { status: 201, errorCode: null, eventName: value.name };
}

function failureMessage(code: string): string {
  switch (code) {
    case "KEY_REVOKED":
      return "This project API key has been revoked.";
    case "RATE_LIMITED":
      return "The project event limit has been reached. Wait before retrying.";
    case "INVALID_JSON":
      return "The request body must contain valid JSON.";
    case "INVALID_PAYLOAD":
      return "The request body must be an object containing only name.";
    case "INVALID_EVENT_NAME":
      return "Event name must start with a letter and contain up to 64 letters, numbers, or underscores.";
    case "PAYLOAD_TOO_LARGE":
      return "The request body must not exceed 1 KiB.";
    case "UNSUPPORTED_MEDIA_TYPE":
      return "Content-Type must be application/json.";
    default:
      return "The event request was rejected.";
  }
}

async function recordOutcome(
  tx: Prisma.TransactionClient,
  values: {
    requestId: string;
    projectId: string;
    keyId: string;
    receivedAt: Date;
    outcome: "ACCEPTED" | "REJECTED";
    status: number;
    errorCode: string | null;
    eventName: string | null;
    quotaAt: Date | null;
  },
): Promise<void> {
  await tx.requestRecord.create({
    data: {
      id: values.requestId,
      projectId: values.projectId,
      keyId: values.keyId,
      receivedAt: values.receivedAt,
      quotaAt: values.quotaAt,
      outcome: values.outcome,
      httpStatus: values.status,
      errorCode: values.errorCode,
      eventName: values.eventName,
    },
  });
}

async function persistOutcome(
  authenticatedKey: AuthenticatedKey,
  requestId: string,
  receivedAt: Date,
  validation: SafeValidation,
): Promise<StoredResult> {
  return getPrisma().$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT set_config('lock_timeout', '2000ms', true)`;
      await tx.$queryRaw`SELECT set_config('statement_timeout', '3000ms', true)`;

      const projects = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id"
        FROM "Project"
        WHERE "id" = ${authenticatedKey.projectId}::uuid
        FOR UPDATE
      `;
      if (projects.length === 0) {
        throw new Error("Project disappeared during event authentication.");
      }

      const currentKey = await tx.apiKey.findUnique({
        where: { id: authenticatedKey.id },
        select: { id: true, projectId: true, revokedAt: true },
      });
      if (!currentKey || currentKey.projectId !== authenticatedKey.projectId) {
        throw new Error("Key disappeared during event authentication.");
      }

      if (currentKey.revokedAt) {
        await recordOutcome(tx, {
          requestId,
          projectId: authenticatedKey.projectId,
          keyId: authenticatedKey.id,
          receivedAt,
          outcome: "REJECTED",
          status: 401,
          errorCode: "KEY_REVOKED",
          eventName: null,
          quotaAt: null,
        });
        return {
          status: 401,
          errorCode: "KEY_REVOKED",
          eventName: null,
          receivedAt,
        };
      }

      const clocks = await tx.$queryRaw<AdmissionClock[]>`
        WITH admission_clock AS (
          SELECT clock_timestamp() AS "now"
        )
        SELECT admission_clock."now" AS "now",
          COUNT(records."id")::int AS "admittedCount",
          MIN(records."quotaAt") AS "oldestAdmission"
        FROM admission_clock
        LEFT JOIN "RequestRecord" AS records
          ON records."projectId" = ${authenticatedKey.projectId}::uuid
          AND records."quotaAt" > admission_clock."now" - INTERVAL '60 seconds'
        GROUP BY admission_clock."now"
      `;
      const clock = clocks[0];
      if (!clock) {
        throw new Error("Could not sample database admission time.");
      }

      if (clock.admittedCount >= 60) {
        const oldestTime = clock.oldestAdmission?.getTime() ?? clock.now.getTime();
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((oldestTime + 60_000 - clock.now.getTime()) / 1000),
        );
        await recordOutcome(tx, {
          requestId,
          projectId: authenticatedKey.projectId,
          keyId: authenticatedKey.id,
          receivedAt,
          outcome: "REJECTED",
          status: 429,
          errorCode: "RATE_LIMITED",
          eventName: null,
          quotaAt: null,
        });
        return {
          status: 429,
          errorCode: "RATE_LIMITED",
          eventName: null,
          receivedAt,
          retryAfterSeconds,
        };
      }

      const quotaAt = clock.now;
      await recordOutcome(tx, {
        requestId,
        projectId: authenticatedKey.projectId,
        keyId: authenticatedKey.id,
        receivedAt,
        outcome: validation.status === 201 ? "ACCEPTED" : "REJECTED",
        status: validation.status,
        errorCode: validation.errorCode,
        eventName: validation.eventName,
        quotaAt,
      });

      return {
        status: validation.status,
        errorCode: validation.errorCode,
        eventName: validation.eventName,
        receivedAt,
      };
    },
    { maxWait: 2_000, timeout: 5_000 },
  );
}

export async function submitEvent(request: Request): Promise<Response> {
  const requestId = randomUUID();

  if (process.env.INGESTION_ENABLED?.toLowerCase() === "false") {
    return errorResponse(
      requestId,
      503,
      "STORAGE_UNAVAILABLE",
      "Event ingestion is temporarily unavailable.",
    );
  }

  const credential = readCredential(request);
  if (!credential.ok) {
    return unauthorized(requestId);
  }
  const receivedAt = new Date();

  const contentType = request.headers
    .get("content-type")
    ?.split(";")[0]
    .trim()
    .toLowerCase();
  const bodyResult =
    contentType === "application/json"
      ? await readBody(request)
      : { ok: false as const, reason: "content-type" as const };
  const validation = validatePayload(
    bodyResult.ok ? bodyResult.value : undefined,
    bodyResult.ok ? null : bodyResult.reason,
  );

  try {
    const key = await authenticateCredential(credential.keyId, credential.secret);
    if (!key) {
      return unauthorized(requestId);
    }

    const result = await persistOutcome(key, requestId, receivedAt, validation);
    if (result.status === 201) {
      return jsonResponse(requestId, 201, {
        event: {
          id: requestId,
          name: result.eventName,
          receivedAt: result.receivedAt.toISOString(),
        },
        requestId,
      });
    }

    return errorResponse(
      requestId,
      result.status,
      result.errorCode ?? "REQUEST_REJECTED",
      failureMessage(result.errorCode ?? "REQUEST_REJECTED"),
      result.retryAfterSeconds,
    );
  } catch {
    console.error(
      JSON.stringify({
        requestId,
        route: REQUEST_PATH,
        status: 503,
        errorCode: "STORAGE_UNAVAILABLE",
      }),
    );
    return errorResponse(
      requestId,
      503,
      "STORAGE_UNAVAILABLE",
      "Event storage is temporarily unavailable.",
    );
  }
}

async function readBody(
  request: Request,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; reason: JsonBodyFailureReason }
> {
  return readBoundedJsonBody(request, MAX_BODY_BYTES);
}
