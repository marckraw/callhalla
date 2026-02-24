import { describe, expect, it } from "vitest";
import type { RequestDraft } from "@/shared";
import { buildProxyRequestPayload } from "./request-payload.pure";

const baseDraft: RequestDraft = {
  method: "POST",
  url: "https://api.example.com/items",
  bodyMode: "none",
  bodyText: "",
  headers: [{ id: "1", key: "x-key", value: "123", enabled: true }],
};

describe("buildProxyRequestPayload", () => {
  it("returns payload for valid requests", () => {
    const result = buildProxyRequestPayload(baseDraft);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.payload.method).toBe("POST");
    expect(result.payload.url).toBe("https://api.example.com/items");
    expect(result.payload.headers["x-key"]).toBe("123");
  });

  it("rejects non-http urls", () => {
    const result = buildProxyRequestPayload({ ...baseDraft, url: "ftp://example.com" });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors).toContain("URL must be a valid http:// or https:// address.");
  });

  it("validates json bodies", () => {
    const result = buildProxyRequestPayload({
      ...baseDraft,
      bodyMode: "json",
      bodyText: "{\"name\":\"odin\"}",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.payload.body).toBe('{"name":"odin"}');
    expect(result.payload.headers["content-type"]).toBe("application/json");
  });

  it("rejects invalid json body", () => {
    const result = buildProxyRequestPayload({
      ...baseDraft,
      bodyMode: "json",
      bodyText: "{broken}",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors).toContain("JSON body is invalid.");
  });

  it("rejects body on get requests", () => {
    const result = buildProxyRequestPayload({
      ...baseDraft,
      method: "GET",
      bodyMode: "text",
      bodyText: "hello",
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.errors).toContain("GET requests cannot include a body.");
  });
});
