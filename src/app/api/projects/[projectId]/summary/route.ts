import { getOwnedActivitySummary } from "@/server/activity";
import { handleActivitySummary } from "@/server/activity-api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return handleActivitySummary(request, context, getOwnedActivitySummary);
}
