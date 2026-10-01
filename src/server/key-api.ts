import { apiError } from "@/server/api-response";
import {
  KeyStateChangedError,
  OwnedProjectNotFoundError,
  ProjectKeyNotFoundError,
} from "@/server/keys";

export function parseExpectedKeyVersion(value: unknown): number | null {
  return Number.isSafeInteger(value) && typeof value === "number" && value >= 0
    ? value
    : null;
}

export function keyMutationFailureResponse(error: unknown): Response {
  if (
    error instanceof OwnedProjectNotFoundError ||
    error instanceof ProjectKeyNotFoundError
  ) {
    return apiError(404, "NOT_FOUND", "Project or key not found.");
  }

  if (error instanceof KeyStateChangedError) {
    return apiError(
      409,
      "KEY_STATE_CHANGED",
      "The project key changed. Refresh the project and try again.",
    );
  }

  return apiError(
    503,
    "SERVICE_UNAVAILABLE",
    "Project key management is temporarily unavailable.",
  );
}

export function keyMutationRateLimitResponse(retryAfterSeconds: number): Response {
  return apiError(
    429,
    "RATE_LIMITED",
    "You have reached the project key change limit for this minute.",
    undefined,
    { "Retry-After": String(retryAfterSeconds) },
  );
}
