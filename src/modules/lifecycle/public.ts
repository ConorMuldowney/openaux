export const SHOWCASE_LIFECYCLE_STATES = [
  "creation",
  "submission-open",
  "voting-open",
  "finalized",
] as const;

export type ShowcaseLifecycleState = (typeof SHOWCASE_LIFECYCLE_STATES)[number];

const ALLOWED_TRANSITIONS: Record<ShowcaseLifecycleState, ShowcaseLifecycleState[]> = {
  creation: ["submission-open", "finalized"],
  "submission-open": ["voting-open"],
  "voting-open": ["finalized"],
  finalized: [],
};

export function canTransitionLifecycle(
  currentState: ShowcaseLifecycleState,
  nextState: ShowcaseLifecycleState,
): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(nextState);
}

export function toPrismaLifecycleState(
  state: ShowcaseLifecycleState,
):
  | "CREATION"
  | "SUBMISSION_OPEN"
  | "VOTING_OPEN"
  | "FINALIZED" {
  const lifecycleStateMap: Record<
    ShowcaseLifecycleState,
    "CREATION" | "SUBMISSION_OPEN" | "VOTING_OPEN" | "FINALIZED"
  > = {
    creation: "CREATION",
    "submission-open": "SUBMISSION_OPEN",
    "voting-open": "VOTING_OPEN",
    finalized: "FINALIZED",
  };

  return lifecycleStateMap[state];
}

export function fromPrismaLifecycleState(
  state: string,
): ShowcaseLifecycleState | null {
  const lifecycleStateMap: Record<string, ShowcaseLifecycleState> = {
    CREATION: "creation",
    SUBMISSION_OPEN: "submission-open",
    VOTING_OPEN: "voting-open",
    FINALIZED: "finalized",
  };

  return lifecycleStateMap[state] ?? null;
}
