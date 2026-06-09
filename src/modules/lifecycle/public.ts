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
