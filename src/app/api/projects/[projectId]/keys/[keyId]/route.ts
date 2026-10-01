import { auth } from "@clerk/nextjs/server";
import { apiError, apiResponse, isAllowedSameOrigin } from "@/server/api-response";
import { readStrictJsonObject } from "@/server/api-request";
import {
  keyMutationFailureResponse,
  keyMutationRateLimitResponse,
  parseExpectedKeyVersion,
} from "@/server/key-api";
import { revokeProjectKey } from "@/server/keys";

export const runtime = "nodejs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ projectId: string; keyId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to manage project keys.");
  }

  if (!isAllowedSameOrigin(request)) {
    return apiError(403, "ORIGIN_NOT_ALLOWED", "This request origin is not allowed.");
  }

  const body = await readStrictJsonObject(request, ["expectedKeyVersion", "confirmed"]);
  if (!body.ok) {
    return body.reason === "too-large"
      ? apiError(413, "BODY_TOO_LARGE", "The request body exceeds 1 KiB.")
      : apiError(400, "INVALID_BODY", "Send expectedKeyVersion and confirmed as JSON.");
  }

  const expectedKeyVersion = parseExpectedKeyVersion(body.value.expectedKeyVersion);
  if (expectedKeyVersion === null || body.value.confirmed !== true) {
    return apiError(
      400,
      "INVALID_BODY",
      "Provide a non-negative expectedKeyVersion and confirm the revocation.",
    );
  }

  const { projectId, keyId } = await context.params;
  try {
    const result = await revokeProjectKey(
      userId,
      projectId,
      keyId,
      expectedKeyVersion,
    );
    if (!result.ok) {
      return keyMutationRateLimitResponse(result.retryAfterSeconds);
    }
    return apiResponse({ revoked: true, keyVersion: result.value.keyVersion });
  } catch (error) {
    return keyMutationFailureResponse(error);
  }
}
