import { describe, expect, it } from "vitest";
import { shouldVoidShowcaseAtSubmissionClose } from "@/src/modules/submissions/public";

describe("submissions boundary rules", () => {
  it("voids showcases with fewer than two valid entries at submission close", () => {
    expect(shouldVoidShowcaseAtSubmissionClose(0)).toBe(true);
    expect(shouldVoidShowcaseAtSubmissionClose(1)).toBe(true);
    expect(shouldVoidShowcaseAtSubmissionClose(2)).toBe(false);
    expect(shouldVoidShowcaseAtSubmissionClose(5)).toBe(false);
  });
});
