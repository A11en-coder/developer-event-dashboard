import { auth } from "@clerk/nextjs/server";
import { apiError, apiResponse, isAllowedSameOrigin } from "@/server/api-response";
import { readStrictJsonObject } from "@/server/api-request";
import {
  keyMutationFailureResponse,
  keyMutationRateLimitResponse,
  parseExpectedKeyVersion,
} from "@/server/key-api";
import { issueProjectKey } from "@/server/keys";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to manage project keys.");
  }

  if (!isAllowedSameOrigin(request)) {
    return apiError(403, "ORIGIN_NOT_ALLOWED", "This request origin is not allowed.");
  }

  const body = await readStrictJsonObject(request, ["expectedKeyVersion"]);
  if (!body.ok) {
    return body.reason === "too-large"
      ? apiError(413, "BODY_TOO_LARGE", "The request body exceeds 1 KiB.")
      : apiError(400, "INVALID_BODY", "Send only expectedKeyVersion as JSON.");
  }

  const expectedKeyVersion = parseExpectedKeyVersion(body.value.expectedKeyVersion);
  if (expectedKeyVersion === null) {
    return apiError(400, "INVALID_BODY", "expectedKeyVersion must be a non-negative integer.");
  }

  const { projectId } = await context.params;
  try {
    const result = await issueProjectKey(userId, projectId, expectedKeyVersion);
    if (!result.ok) {
      return keyMutationRateLimitResponse(result.retryAfterSeconds);
    }
    return apiResponse(result.value, 201);
  } catch (error) {
    return keyMutationFailureResponse(error);
  }
}
