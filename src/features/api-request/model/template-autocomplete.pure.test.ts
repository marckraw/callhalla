import { describe, expect, it } from "vitest";
import {
  applyTemplateSuggestion,
  findTemplateTokenAtCursor,
} from "./template-autocomplete.pure";

describe("findTemplateTokenAtCursor", () => {
  it("returns query when cursor is inside an open template token", () => {
    const value = "https://{{base";
    const result = findTemplateTokenAtCursor(value, value.length);

    expect(result).toEqual({
      start: 8,
      query: "base",
    });
  });

  it("returns null when token is already closed before cursor", () => {
    const value = "https://{{base_url}}/users";
    const cursor = value.length;
    expect(findTemplateTokenAtCursor(value, cursor)).toBeNull();
  });
});

describe("applyTemplateSuggestion", () => {
  it("replaces current token query with selected template key", () => {
    const value = "https://{{bas";
    const result = applyTemplateSuggestion(value, value.length, "base_url");

    expect(result).toEqual({
      value: "https://{{base_url}}",
      nextCursor: "https://{{base_url}}".length,
    });
  });

  it("reuses existing closing braces when present", () => {
    const value = "https://{{bas}}/users";
    const cursor = "https://{{bas".length;
    const result = applyTemplateSuggestion(value, cursor, "base_url");

    expect(result).toEqual({
      value: "https://{{base_url}}/users",
      nextCursor: "https://{{base_url}}".length,
    });
  });
});
