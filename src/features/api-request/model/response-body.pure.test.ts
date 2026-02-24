import { describe, expect, it } from "vitest";
import { formatResponseBody } from "./response-body.pure";

describe("formatResponseBody", () => {
  it("pretty-prints json responses", () => {
    const result = formatResponseBody('{"ok":true}', { "content-type": "application/json" });

    expect(result).toBe('{\n  "ok": true\n}');
  });

  it("returns non-json bodies untouched", () => {
    const result = formatResponseBody("plain", { "content-type": "text/plain" });

    expect(result).toBe("plain");
  });

  it("returns invalid json untouched", () => {
    const result = formatResponseBody("{broken}", { "content-type": "application/json" });

    expect(result).toBe("{broken}");
  });
});
