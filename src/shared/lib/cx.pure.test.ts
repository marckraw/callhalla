import { describe, expect, it } from "vitest";
import { cx } from "./cx.pure";

describe("cx", () => {
  it("joins only truthy class names", () => {
    expect(cx("a", undefined, "b", false, "c")).toBe("a b c");
  });

  it("returns empty string when all values are falsy", () => {
    expect(cx(undefined, null, false)).toBe("");
  });
});
