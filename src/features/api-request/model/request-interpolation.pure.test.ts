import { describe, expect, it } from "vitest";
import type { RequestDraft } from "@/shared";
import {
  extractTemplateVariables,
  resolveDraftTemplates,
  resolveTemplateValue,
} from "./request-interpolation.pure";

const baseDraft: RequestDraft = {
  method: "POST",
  url: "{{base_url}}/users",
  bodyMode: "json",
  bodyText: '{"token":"{{token}}","limit":{{limit}}}',
  headers: [
    {
      id: "h1",
      key: "Authorization",
      value: "Bearer {{token}}",
      enabled: true,
    },
  ],
};

describe("extractTemplateVariables", () => {
  it("collects valid template keys once", () => {
    expect(extractTemplateVariables("{{base_url}} {{base_url}} {{token}}"))
      .toEqual(["base_url", "token"]);
  });
});

describe("resolveTemplateValue", () => {
  it("replaces known variables", () => {
    const resolved = resolveTemplateValue("{{base_url}}/health", { base_url: "https://api.example.com" });

    expect(resolved.value).toBe("https://api.example.com/health");
    expect(resolved.missingVariables).toEqual([]);
    expect(resolved.invalidVariables).toEqual([]);
  });

  it("returns missing and invalid variables", () => {
    const resolved = resolveTemplateValue("{{missing}} {{bad-key}}", {});

    expect(resolved.missingVariables).toEqual(["missing"]);
    expect(resolved.invalidVariables).toEqual(["bad-key"]);
  });
});

describe("resolveDraftTemplates", () => {
  it("resolves placeholders across url, headers, and body", () => {
    const result = resolveDraftTemplates(baseDraft, {
      base_url: "https://api.example.com",
      token: "abc",
      limit: "10",
    });

    expect(result.missingVariables).toEqual([]);
    expect(result.invalidVariables).toEqual([]);
    expect(result.resolvedDraft.url).toBe("https://api.example.com/users");
    expect(result.resolvedDraft.headers[0]?.value).toBe("Bearer abc");
    expect(result.resolvedDraft.bodyText).toBe('{"token":"abc","limit":10}');
  });

  it("reports missing variables from any draft field", () => {
    const result = resolveDraftTemplates(baseDraft, { base_url: "https://api.example.com" });

    expect(result.missingVariables).toEqual(["token", "limit"]);
  });
});
