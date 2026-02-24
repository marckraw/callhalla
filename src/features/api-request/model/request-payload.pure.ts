import type {
  HttpMethod,
  ProxyRequestPayload,
  RequestDraft,
  RequestPreparationResult,
} from "@/shared";

const METHODS_WITHOUT_BODY = new Set<HttpMethod>(["GET", "HEAD"]);

type BuildProxyRequestPayloadOptions = {
  requireHttpUrl?: boolean;
  validateJsonBody?: boolean;
};

const canUseBody = (method: HttpMethod) => !METHODS_WITHOUT_BODY.has(method);

const isHttpUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const buildProxyRequestPayload = (
  draft: RequestDraft,
  options: BuildProxyRequestPayloadOptions = {},
): RequestPreparationResult => {
  const { requireHttpUrl = true, validateJsonBody = true } = options;
  const errors: string[] = [];
  const normalizedUrl = draft.url.trim();

  if (requireHttpUrl) {
    if (!isHttpUrl(normalizedUrl)) {
      errors.push("URL must be a valid http:// or https:// address.");
    }
  } else if (normalizedUrl.length === 0) {
    errors.push("URL is required.");
  }

  const headers: Record<string, string> = {};
  const seenHeaders = new Set<string>();

  for (const row of draft.headers) {
    if (!row.enabled) {
      continue;
    }

    const key = row.key.trim();
    const value = row.value.trim();

    if (key.length === 0 && value.length === 0) {
      continue;
    }

    if (key.length === 0) {
      errors.push("Header key cannot be empty.");
      continue;
    }

    const normalizedKey = key.toLowerCase();
    if (seenHeaders.has(normalizedKey)) {
      errors.push(`Header "${key}" is duplicated.`);
      continue;
    }

    seenHeaders.add(normalizedKey);
    headers[key] = value;
  }

  if (draft.bodyMode !== "none" && !canUseBody(draft.method)) {
    errors.push(`${draft.method} requests cannot include a body.`);
  }

  let body: string | undefined;
  const trimmedBody = draft.bodyText.trim();

  if (draft.bodyMode === "json" && trimmedBody.length > 0) {
    if (validateJsonBody) {
      try {
        body = JSON.stringify(JSON.parse(trimmedBody));
      } catch {
        errors.push("JSON body is invalid.");
      }
    } else {
      body = draft.bodyText;
    }

    const hasContentType = Object.keys(headers).some(
      (headerName) => headerName.toLowerCase() === "content-type",
    );
    if (!hasContentType) {
      headers["content-type"] = "application/json";
    }
  }

  if (draft.bodyMode === "text" && trimmedBody.length > 0) {
    body = draft.bodyText;

    const hasContentType = Object.keys(headers).some(
      (headerName) => headerName.toLowerCase() === "content-type",
    );
    if (!hasContentType) {
      headers["content-type"] = "text/plain";
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const payload: ProxyRequestPayload = {
    method: draft.method,
    url: normalizedUrl,
    headers,
    bodyMode: draft.bodyMode,
  };

  if (body !== undefined) {
    payload.body = body;
  }

  return { ok: true, payload };
};
