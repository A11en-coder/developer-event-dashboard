import { auth } from "@clerk/nextjs/server";
import { apiError, apiResponse } from "@/server/api-response";
import {
  InvalidActivityCursorError,
  parseActivityCursor,
  type ActivityEndpoint,
} from "@/server/activity";

type ProjectRouteContext = {
  params: Promise<{ projectId: string }>;
};

type PageLoader<T> = (
  ownerClerkUserId: string,
  projectId: string,
  limit: number,
  cursor: NonNullable<ReturnType<typeof parseActivityCursor>> | null,
) => Promise<T | null>;

type SummaryLoader<T> = (
  ownerClerkUserId: string,
  projectId: string,
) => Promise<T | null>;

function invalidCursorResponse() {
  return apiError(400, "INVALID_CURSOR", "The activity page cursor is invalid.");
}

function unavailableResponse() {
  return apiError(
    503,
    "SERVICE_UNAVAILABLE",
    "Project activity is temporarily unavailable.",
  );
}

export async function handleActivitySummary<T>(
  _request: Request,
  context: ProjectRouteContext,
  load: SummaryLoader<T>,
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to access this project.");
  }

  const { projectId } = await context.params;
  try {
    const result = await load(userId, projectId);
    if (!result) {
      return apiError(404, "NOT_FOUND", "Project not found.");
    }
    return apiResponse(result);
  } catch {
    return unavailableResponse();
  }
}

export async function handleActivityPage<T>(
  request: Request,
  context: ProjectRouteContext,
  endpoint: ActivityEndpoint,
  defaultLimit: number,
  load: PageLoader<T>,
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to access this project.");
  }

  const { projectId } = await context.params;
  const url = new URL(request.url);
  const limits = url.searchParams.getAll("limit");
  const cursors = url.searchParams.getAll("cursor");
  if (limits.length > 1 || cursors.length > 1) {
    return invalidCursorResponse();
  }

  let limit = defaultLimit;
  if (limits.length === 1) {
    if (!/^[1-9]\d{0,2}$/.test(limits[0])) {
      return apiError(400, "INVALID_LIMIT", "Limit must be between 1 and 100.");
    }
    limit = Number(limits[0]);
    if (limit > 100) {
      return apiError(400, "INVALID_LIMIT", "Limit must be between 1 and 100.");
    }
  }

  const cursorValue = cursors[0];
  const cursor = cursorValue
    ? parseActivityCursor(cursorValue, endpoint, projectId)
    : null;
  if (cursorValue !== undefined && !cursor) {
    return invalidCursorResponse();
  }

  try {
    const result = await load(userId, projectId, limit, cursor);
    if (!result) {
      return apiError(404, "NOT_FOUND", "Project not found.");
    }
    return apiResponse(result);
  } catch (error) {
    if (error instanceof InvalidActivityCursorError) {
      return invalidCursorResponse();
    }
    return unavailableResponse();
  }
}
