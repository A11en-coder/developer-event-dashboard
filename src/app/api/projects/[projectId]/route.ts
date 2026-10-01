import { auth } from "@clerk/nextjs/server";
import { apiError, apiResponse } from "@/server/api-response";
import { getOwnedProject } from "@/server/projects";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError(401, "UNAUTHENTICATED", "Sign in to access this project.");
  }

  const { projectId } = await context.params;
  try {
    const project = await getOwnedProject(userId, projectId);
    if (!project) {
      return apiError(404, "NOT_FOUND", "Project not found.");
    }

    return apiResponse({
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        activeKey: project.activeKey,
        keyVersion: project.keyVersion,
      },
    });
  } catch {
    return apiError(
      503,
      "SERVICE_UNAVAILABLE",
      "Project data is temporarily unavailable.",
    );
  }
}
