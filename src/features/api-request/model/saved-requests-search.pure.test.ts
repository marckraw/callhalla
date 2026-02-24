import { describe, expect, it } from "vitest";
import type { SavedRequest } from "@/shared";
import { filterSavedRequests, parseTagsInput } from "./saved-requests-search.pure";

const requests: SavedRequest[] = [
  {
    id: "1",
    name: "Get users",
    tags: ["users", "prod"],
    createdAt: "2026-02-24T10:00:00.000Z",
    updatedAt: "2026-02-24T10:00:00.000Z",
    draft: {
      method: "GET",
      url: "https://api.example.com/users",
      headers: [],
      bodyMode: "none",
      bodyText: "",
    },
  },
  {
    id: "2",
    name: "Create webhook",
    tags: ["webhook", "staging"],
    createdAt: "2026-02-24T10:00:00.000Z",
    updatedAt: "2026-02-24T10:00:00.000Z",
    draft: {
      method: "POST",
      url: "https://api.example.com/hooks",
      headers: [],
      bodyMode: "json",
      bodyText: "{}",
    },
  },
];

describe("parseTagsInput", () => {
  it("parses comma-separated tags and deduplicates values", () => {
    expect(parseTagsInput("users, prod, users")).toEqual(["users", "prod"]);
  });

  it("parses newline-separated tags", () => {
    expect(parseTagsInput("one\ntwo")).toEqual(["one", "two"]);
  });
});

describe("filterSavedRequests", () => {
  it("returns all requests for empty query", () => {
    expect(filterSavedRequests(requests, "")).toEqual(requests);
  });

  it("matches by tag", () => {
    const result = filterSavedRequests(requests, "webhook");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("2");
  });

  it("matches by method + name terms", () => {
    const result = filterSavedRequests(requests, "get users");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });
});
