import { describe, expect, it } from "vitest";
import {
  isEntryValidForRequiredSamples,
  shouldVoidShowcaseAtSubmissionClose,
} from "@/src/modules/submissions/public";

describe("submissions boundary rules", () => {
  it("requires every required sample to be present in the entry", () => {
    expect(
      isEntryValidForRequiredSamples({
        participantId: "participant-1",
        showcaseId: "showcase-1",
        requiredSampleIds: ["kick", "snare"],
        usedSampleIds: ["kick", "snare", "vocal"],
      }),
    ).toBe(true);

    expect(
      isEntryValidForRequiredSamples({
        participantId: "participant-1",
        showcaseId: "showcase-1",
        requiredSampleIds: ["kick", "snare"],
        usedSampleIds: ["kick"],
      }),
    ).toBe(false);

    expect(
      isEntryValidForRequiredSamples({
        participantId: "participant-1",
        showcaseId: "showcase-1",
        requiredSampleIds: [],
        usedSampleIds: ["kick"],
      }),
    ).toBe(false);
  });

  it("voids showcases with fewer than two valid entries at submission close", () => {
    expect(shouldVoidShowcaseAtSubmissionClose(0)).toBe(true);
    expect(shouldVoidShowcaseAtSubmissionClose(1)).toBe(true);
    expect(shouldVoidShowcaseAtSubmissionClose(2)).toBe(false);
    expect(shouldVoidShowcaseAtSubmissionClose(5)).toBe(false);
  });
});
