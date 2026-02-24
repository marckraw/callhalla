import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildProxyRequestPayload,
  resolveDraftTemplates,
} from "@/features/api-request/server";
import type { HttpMethod } from "@/shared";
import {
  getActiveEnvironmentVariablesMap,
  getAuthenticatedServerClient,
} from "@/shared/server";

const headerSchema = z.object({
  id: z.string().min(1),
  key: z.string(),
  value: z.string(),
  enabled: z.boolean(),
});

const requestSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]),
  url: z.string(),
  headers: z.array(headerSchema),
  bodyMode: z.enum(["none", "json", "text"]),
  bodyText: z.string(),
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
const UPSTREAM_TIMEOUT_MS = 15000;

type ProxyNetworkDebug = {
  code: string | null;
  cause: string | null;
  targetHost: string;
  hint: string | null;
};

const readCauseCode = (error: Error): string | null => {
  const cause = error.cause as { code?: string; errno?: string } | undefined;

  if (!cause) {
    return null;
  }

  return cause.code ?? cause.errno ?? null;
};

const readCauseMessage = (error: Error): string | null => {
  const cause = error.cause as { message?: string } | undefined;

  if (!cause || typeof cause.message !== "string") {
    return null;
  }

  return cause.message;
};

const buildNetworkHint = (targetHost: string, code: string | null): string | null => {
  if (code === "ENOTFOUND") {
    return `Host '${targetHost}' could not be resolved from the Callhalla server runtime.`;
  }

  if (code === "ECONNREFUSED") {
    return `Connection was refused by '${targetHost}'. Confirm the service is running and reachable.`;
  }

  if (code === "ECONNRESET") {
    return `Connection to '${targetHost}' was reset during request processing.`;
  }

  if (code === "ETIMEDOUT") {
    return `Connection to '${targetHost}' timed out.`;
  }

  return null;
};

const buildNetworkErrorPayload = (
  error: unknown,
  targetHost: string,
): {
  status: number;
  body: {
    error: string;
    debug: ProxyNetworkDebug;
  };
} => {
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return {
      status: 504,
      body: {
        error: `Upstream request timed out after ${UPSTREAM_TIMEOUT_MS}ms.`,
        debug: {
          code: "TIMEOUT",
          cause: error.message,
          targetHost,
          hint: `The upstream server did not respond within ${UPSTREAM_TIMEOUT_MS}ms.`,
        },
      },
    };
  }

  if (error instanceof Error) {
    const code = readCauseCode(error);
    const cause = readCauseMessage(error) ?? error.message;

    return {
      status: 502,
      body: {
        error: `Upstream request failed${code ? ` (${code})` : ""}: ${error.message}`,
        debug: {
          code,
          cause,
          targetHost,
          hint: buildNetworkHint(targetHost, code),
        },
      },
    };
  }

  return {
    status: 502,
    body: {
      error: "Upstream request failed for an unknown reason.",
      debug: {
        code: null,
        cause: null,
        targetHost,
        hint: null,
      },
    },
  };
};

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedServerClient();

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

    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const variableMap = await getActiveEnvironmentVariablesMap(supabase, user.id);
    const resolution = resolveDraftTemplates(input, variableMap);

    if (resolution.invalidVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid variable placeholders: ${resolution.invalidVariables.join(", ")}. Use snake_case keys.`,
          invalidVariables: resolution.invalidVariables,
        },
        { status: 400 },
      );
    }

    if (resolution.missingVariables.length > 0) {
      return NextResponse.json(
        {
          error: `Missing variables: ${resolution.missingVariables.join(", ")}.`,
          missingVariables: resolution.missingVariables,
        },
        { status: 422 },
      );
    }

    const preparation = buildProxyRequestPayload(resolution.resolvedDraft, {
      requireHttpUrl: true,
      validateJsonBody: true,
    });

    if (!preparation.ok) {
      return NextResponse.json(
        {
          error: preparation.errors[0] ?? "Invalid request payload.",
          errors: preparation.errors,
        },
        { status: 400 },
      );
    }

    const target = new URL(preparation.payload.url);
    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json(
        {
          error: "Only http and https protocols are supported.",
        },
        { status: 400 },
      );
    }

    const forwardedHeaders = new Headers();
    for (const [key, value] of Object.entries(preparation.payload.headers)) {
      if (!blockedHeaders.has(key.toLowerCase())) {
        forwardedHeaders.set(key, value);
      }
    }

    const startedAt = performance.now();
    let upstreamResponse: Response;

    try {
      upstreamResponse = await fetch(preparation.payload.url, {
        method: preparation.payload.method,
        headers: forwardedHeaders,
        body: methodAllowsBody(preparation.payload.method) ? preparation.payload.body : undefined,
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      });
    } catch (fetchError) {
      const payload = buildNetworkErrorPayload(fetchError, target.host);

      console.error("Callhalla proxy upstream fetch failed", {
        method: preparation.payload.method,
        url: preparation.payload.url,
        debug: payload.body.debug,
      });

      return NextResponse.json(payload.body, { status: payload.status });
    }

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
