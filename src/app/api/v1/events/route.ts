import { submitEvent } from "@/server/ingestion";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return submitEvent(request);
}
