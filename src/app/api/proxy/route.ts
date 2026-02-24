import { NextResponse } from "next/server";
import { z } from "zod";
import type { HttpMethod } from "@/shared";
import { getServerUser } from "@/shared/server";

const requestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()),
  bodyMode: z.enum(["none", "json", "text"]),
  body: z.string().optional(),
});

const blockedHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const methodAllowsBody = (method: HttpMethod) => !["GET", "HEAD"].includes(method);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "Authentication required.",
      },
      { status: 401 },
    );
  }

  try {
    const input = requestSchema.parse(await request.json());

    const target = new URL(input.url);
    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json(
        {
          error: "Only http and https protocols are supported.",
        },
        { status: 400 },
      );
    }

    const forwardedHeaders = new Headers();
    for (const [key, value] of Object.entries(input.headers)) {
      if (!blockedHeaders.has(key.toLowerCase())) {
        forwardedHeaders.set(key, value);
      }
    }

    const startedAt = performance.now();
    const upstreamResponse = await fetch(input.url, {
      method: input.method,
      headers: forwardedHeaders,
      body: methodAllowsBody(input.method) ? input.body : undefined,
      cache: "no-store",
      redirect: "manual",
    });

    const durationMs = Math.round(performance.now() - startedAt);
    const body = await upstreamResponse.text();

    return NextResponse.json({
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: Object.fromEntries(upstreamResponse.headers.entries()),
      body,
      durationMs,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid request payload.",
        },
        { status: 400 },
      );
    }

    const message = error instanceof Error ? error.message : "Proxy request failed.";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 502 },
    );
  }
}
