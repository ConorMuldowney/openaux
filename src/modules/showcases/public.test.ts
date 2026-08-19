import { describe, expect, it } from "vitest";
import {
  getShowcaseSectionsForRole,
  resolveShowcaseViewerRole,
  toShowcaseCardViewModels,
} from "@/src/modules/showcases/public";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

function createShowcase(overrides: Partial<ShowcaseDetailData>): ShowcaseDetailData {
  return {
    showcaseId: "d95cc461-e52e-4ed3-9a15-2f8ab646dcf0",
    slug: "test-showcase",
    title: "Test Showcase",
    hostUserId: "user-host-1",
    lifecycleState: "creation",
    participationScope: "public",
    listenerScope: "invite-only",
    voterScope: "public-authenticated",
    blindJudgingEnabled: true,
    maxRankedPicks: 5,
    requiredSampleIds: ["sample-1"],
    submissionOpensAt: new Date("2026-01-10T10:00:00.000Z"),
    submissionClosesAt: new Date("2026-01-12T10:00:00.000Z"),
    votingOpensAt: new Date("2026-01-13T10:00:00.000Z"),
    votingClosesAt: new Date("2026-01-15T10:00:00.000Z"),
    finalizedAt: null,
    createdAt: new Date("2026-01-01T10:00:00.000Z"),
    updatedAt: new Date("2026-01-02T10:00:00.000Z"),
    ...overrides,
  };
}

describe("toShowcaseCardViewModels", () => {
  it("maps relationship, lifecycle labels, and scope labels", () => {
    const showcases: ShowcaseDetailData[] = [
      createShowcase({
        lifecycleState: "submission-open",
        hostUserId: "user-host-1",
        participationScope: "invite-only",
        listenerScope: "public",
        voterScope: "invite-only-authenticated",
      }),
    ];

    const [card] = toShowcaseCardViewModels(showcases, "user-host-1");

    expect(card.relationshipLabel).toBe("Hosting");
    expect(card.lifecycleLabel).toBe("Submission Open");
    expect(card.lifecycleBadgeVariant).toBe("secondary");
    expect(card.participationScopeLabel).toBe("Invite-only");
    expect(card.listenerScopeLabel).toBe("Public");
    expect(card.voterScopeLabel).toBe("Invite-only Authenticated");
  });

  it("marks non-host users as participating", () => {
    const showcases: ShowcaseDetailData[] = [createShowcase({ hostUserId: "another-user" })];

    const [card] = toShowcaseCardViewModels(showcases, "current-user");

    expect(card.relationshipLabel).toBe("Participating");
  });

  it("renders unscheduled windows and finalized fallback labels", () => {
    const showcases: ShowcaseDetailData[] = [
      createShowcase({
        submissionOpensAt: null,
        submissionClosesAt: null,
        votingOpensAt: null,
        votingClosesAt: null,
        finalizedAt: null,
      }),
    ];

    const [card] = toShowcaseCardViewModels(showcases, "user-host-1");

    expect(card.submissionWindowLabel).toBe("Not scheduled -> Not scheduled");
    expect(card.votingWindowLabel).toBe("Not scheduled -> Not scheduled");
    expect(card.finalizedAtLabel).toBe("Not scheduled");
  });

  it("maps all remaining lifecycle states to expected labels and variants", () => {
    const showcases: ShowcaseDetailData[] = [
      createShowcase({ showcaseId: "0f4320c8-bd11-4db3-9ca1-798b9a2f9ad8", lifecycleState: "creation" }),
      createShowcase({ showcaseId: "337a04dd-6f41-4d6a-b4d4-11b9f6f95f01", lifecycleState: "voting-open" }),
      createShowcase({ showcaseId: "6837e16f-e1fe-4e57-b90b-4f7b68286059", lifecycleState: "finalized" }),
      createShowcase({ showcaseId: "48fbc359-cb68-4a6a-bf8d-c43c636d3538", lifecycleState: "voided" }),
      createShowcase({ showcaseId: "c9ae7f02-7d9a-45fa-90c5-09ca0f3f9046", lifecycleState: "canceled" }),
    ];

    const cards = toShowcaseCardViewModels(showcases, "user-host-1");

    expect(cards.map((card) => [card.lifecycleLabel, card.lifecycleBadgeVariant])).toEqual([
      ["Creation", "outline"],
      ["Voting Open", "secondary"],
      ["Finalized", "default"],
      ["Voided", "outline"],
      ["Canceled", "outline"],
    ]);
  });
});

describe("resolveShowcaseViewerRole", () => {
  it("prioritizes host over participant and voter", () => {
    const role = resolveShowcaseViewerRole({
      hostUserId: "user-1",
      userId: "user-1",
      isParticipant: true,
      isVoter: true,
    });

    expect(role).toBe("host");
  });

  it("prioritizes participant over voter", () => {
    const role = resolveShowcaseViewerRole({
      hostUserId: "user-host",
      userId: "user-1",
      isParticipant: true,
      isVoter: true,
    });

    expect(role).toBe("participant");
  });

  it("resolves voter when not a host or participant", () => {
    const role = resolveShowcaseViewerRole({
      hostUserId: "user-host",
      userId: "user-1",
      isParticipant: false,
      isVoter: true,
    });

    expect(role).toBe("voter");
  });

  it("falls back to listener otherwise", () => {
    const role = resolveShowcaseViewerRole({
      hostUserId: "user-host",
      userId: "user-1",
      isParticipant: false,
      isVoter: false,
    });

    expect(role).toBe("listener");
  });
});

describe("getShowcaseSectionsForRole", () => {
  it("always includes submission for hosts, regardless of the submit-entry policy", () => {
    expect(getShowcaseSectionsForRole("host", false)).toEqual([
      "submission",
      "entries",
      "listening",
      "participants",
      "voting",
    ]);
  });

  it("includes submission for a listener when the submit-entry policy allows it", () => {
    // e.g. an open showcase where any authenticated user can submit before joining as a participant
    expect(getShowcaseSectionsForRole("listener", true)).toEqual([
      "submission",
      "entries",
      "listening",
      "participants",
    ]);
  });

  it("omits submission for a listener when the submit-entry policy disallows it", () => {
    expect(getShowcaseSectionsForRole("listener", false)).toEqual([
      "entries",
      "listening",
      "participants",
    ]);
  });

  it("includes voting for participants and voters but not listeners", () => {
    expect(getShowcaseSectionsForRole("participant", true)).toContain("voting");
    expect(getShowcaseSectionsForRole("voter", false)).toContain("voting");
    expect(getShowcaseSectionsForRole("listener", false)).not.toContain("voting");
  });
});
