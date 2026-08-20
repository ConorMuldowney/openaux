import { describe, expect, it } from "vitest";
import {
  assignAnonymousCommentAuthorAliases,
  isValidCommentTimestamp,
} from "@/src/modules/comments/public";

describe("isValidCommentTimestamp", () => {
  it("accepts zero and positive finite values within the max bound", () => {
    expect(isValidCommentTimestamp(0)).toBe(true);
    expect(isValidCommentTimestamp(123.45)).toBe(true);
  });

  it("rejects negative, non-finite, or out-of-bound values", () => {
    expect(isValidCommentTimestamp(-1)).toBe(false);
    expect(isValidCommentTimestamp(Number.NaN)).toBe(false);
    expect(isValidCommentTimestamp(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidCommentTimestamp(24 * 60 * 60 + 1)).toBe(false);
  });
});

describe("assignAnonymousCommentAuthorAliases", () => {
  it("assigns stable aliases in first-seen order and reuses them for repeat authors", () => {
    const aliases = assignAnonymousCommentAuthorAliases(["user-a", "user-b", "user-a", "user-c"]);

    expect(aliases.get("user-a")).toBe("Commenter 1");
    expect(aliases.get("user-b")).toBe("Commenter 2");
    expect(aliases.get("user-c")).toBe("Commenter 3");
  });

  it("returns an empty map for no authors", () => {
    expect(assignAnonymousCommentAuthorAliases([]).size).toBe(0);
  });
});
