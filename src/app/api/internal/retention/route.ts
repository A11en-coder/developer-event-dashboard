import { timingSafeEqual } from "node:crypto";
import { apiError, apiResponse } from "@/server/api-response";
import { runRetentionCleanup } from "@/server/retention";

export const runtime = "nodejs";

function hasValidCronSecret(request: Request, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");

  return (
    received.length === expected.length && timingSafeEqual(received, expected)
  );
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "The scheduled cleanup is not configured.",
    );
  }

  if (!hasValidCronSecret(request, secret)) {
    return apiError(401, "UNAUTHENTICATED", "The cleanup credential is invalid.");
  }

  try {
    const result = await runRetentionCleanup();
    if (result.status === "already-running") {
      return apiError(409, "CLEANUP_ALREADY_RUNNING", "A cleanup run is already active.");
    }

    if (result.status === "backlog") {
      console.warn("Retention cleanup reached its per-run deletion limit.", {
        cutoffAt: result.cutoffAt,
        deletedRequestRecords: result.deletedRequestRecords,
        remainingRequestRecords: result.remainingRequestRecords,
        deletedManagementBuckets: result.deletedManagementBuckets,
      });
      return apiError(
        503,
        "CLEANUP_BACKLOG",
        "Expired records remain. An operator must run cleanup again.",
      );
    }

    console.info("Retention cleanup completed.", {
      cutoffAt: result.cutoffAt,
      completedAt: result.completedAt,
      deletedRequestRecords: result.deletedRequestRecords,
      deletedManagementBuckets: result.deletedManagementBuckets,
    });
    return apiResponse({
      ok: true,
      cutoffAt: result.cutoffAt,
      completedAt: result.completedAt,
      deletedRequestRecords: result.deletedRequestRecords,
      deletedManagementBuckets: result.deletedManagementBuckets,
    });
  } catch {
    console.error("Retention cleanup failed.");
    return apiError(
      503,
      "CLEANUP_FAILED",
      "Retention cleanup could not complete.",
    );
  }
}
