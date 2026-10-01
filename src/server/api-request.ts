export type JsonBodyFailureReason = "invalid" | "too-large" | "content-type";

export type JsonBodyReadResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: JsonBodyFailureReason };

export async function readBoundedJsonBody(
  request: Request,
  maximumBytes: number,
  timeoutMs = 3_000,
): Promise<JsonBodyReadResult> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > maximumBytes) {
    return { ok: false, reason: "too-large" };
  }

  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  ) {
    return { ok: false, reason: "content-type" };
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return { ok: false, reason: "invalid" };
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error("Request body read timed out.")), timeoutMs);
    });

    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return {
      ok: true,
      value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    await reader.cancel().catch(() => undefined);
    return { ok: false, reason: "invalid" };
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function readStrictJsonObject(
  request: Request,
  expectedFields: readonly string[],
  maximumBytes = 1024,
): Promise<
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; reason: JsonBodyFailureReason }
> {
  const result = await readBoundedJsonBody(request, maximumBytes);
  if (!result.ok) {
    return result;
  }

  const body = result.value;
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    Object.keys(body).length !== expectedFields.length ||
    !expectedFields.every((field) => Object.hasOwn(body, field))
  ) {
    return { ok: false, reason: "invalid" };
  }

  return { ok: true, value: body as Record<string, unknown> };
}
