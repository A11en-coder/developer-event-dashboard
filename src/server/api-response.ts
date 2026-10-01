import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

type ErrorExtra = {
  fields?: Record<string, string>;
};

export function apiResponse<T>(body: T, status = 200, headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Request-Id", randomUUID());
  return NextResponse.json(body, { status, headers: responseHeaders });
}

export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: ErrorExtra,
  headers?: HeadersInit,
) {
  const requestId = randomUUID();
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  responseHeaders.set("X-Request-Id", requestId);

  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...extra,
      },
      requestId,
    },
    { status, headers: responseHeaders },
  );
}

export function isAllowedSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestOrigin = new URL(request.url).origin;
    const configuredOrigin = process.env.APP_URL
      ? new URL(process.env.APP_URL).origin
      : requestOrigin;

    return (
      originUrl.origin === origin &&
      originUrl.origin === requestOrigin &&
      originUrl.origin === configuredOrigin
    );
  } catch {
    return false;
  }
}
