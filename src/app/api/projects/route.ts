import { auth } from "@clerk/nextjs/server";
import {
  admitProjectCreation,
  createOwnedProject,
  InvalidProjectCursorError,
  listOwnedProjects,
  parseProjectCursor,
  parseProjectName,
} from "@/server/projects";
import { apiError, apiResponse, isAllowedSameOrigin } from "@/server/api-response";
import type { ProjectCursor } from "@/lib/project-types";
import { readStrictJsonObject } from "@/server/api-request";

export const runtime = "nodejs";

function parseLimit(value: string | null): number | null {
  if (value === null) {
    return 20;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const limit = Number(value);
  return Number.isSafeInteger(limit) && limit >= 1 && limit <= 100
    ? limit
    : null;
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to access your projects.");
  }

  const url = new URL(request.url);
  const limitValues = url.searchParams.getAll("limit");
  const cursorValues = url.searchParams.getAll("cursor");
  if (limitValues.length > 1 || cursorValues.length > 1) {
    return apiError(400, "INVALID_QUERY", "The project page query is invalid.");
  }

  const limit = parseLimit(limitValues[0] ?? null);
  if (limit === null) {
    return apiError(400, "INVALID_QUERY", "Limit must be an integer from 1 to 100.");
  }

  let cursor: ProjectCursor | null = null;
  if (cursorValues[0]) {
    cursor = parseProjectCursor(cursorValues[0]);
    if (!cursor) {
      return apiError(400, "INVALID_CURSOR", "The project page cursor is invalid.");
    }
  }

  try {
    return apiResponse(await listOwnedProjects(userId, limit, cursor));
  } catch (error) {
    if (error instanceof InvalidProjectCursorError) {
      return apiError(400, "INVALID_CURSOR", "The project page cursor is invalid.");
    }
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Project data is temporarily unavailable.",
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to create a project.");
  }

  if (!isAllowedSameOrigin(request)) {
    return apiError(
      403,
      "ORIGIN_NOT_ALLOWED",
      "This request origin is not allowed.",
    );
  }

  const parsedBody = await readStrictJsonObject(request, ["name"]);
  if (!parsedBody.ok && parsedBody.reason === "too-large") {
    return apiError(413, "BODY_TOO_LARGE", "The request body exceeds 1 KiB.");
  }
  if (!parsedBody.ok) {
    return apiError(400, "INVALID_BODY", "The request body must be valid JSON.");
  }

  const name = parseProjectName(parsedBody.value.name);
  if (!name) {
    return apiError(
      400,
      "INVALID_PROJECT_NAME",
      "Project names must contain 1–80 characters after trimming.",
      { fields: { name: "Enter a project name from 1 to 80 characters." } },
    );
  }

  try {
    const admission = await admitProjectCreation(userId);
    if (!admission.admitted) {
      return apiError(
        429,
        "RATE_LIMITED",
        "You have reached the project creation limit for this minute.",
        undefined,
        { "Retry-After": String(admission.retryAfterSeconds) },
      );
    }

    const project = await createOwnedProject(userId, name);
    return apiResponse({ project }, 201);
  } catch {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Project creation is temporarily unavailable.",
    );
  }
}
