import { listOwnedEventCounts } from "@/server/activity";
import { handleActivityPage } from "@/server/activity-api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  return handleActivityPage(
    request,
    context,
    "event-counts",
    50,
    listOwnedEventCounts,
  );
}
