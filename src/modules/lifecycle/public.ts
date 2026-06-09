export const OPEN_AUX_LIFECYCLE_STATES = [
  "creation",
  "submission-open",
  "voting-open",
  "finalized",
] as const;

export type OpenAuxLifecycleState = (typeof OPEN_AUX_LIFECYCLE_STATES)[number];

const ALLOWED_TRANSITIONS: Record<OpenAuxLifecycleState, OpenAuxLifecycleState[]> = {
  creation: ["submission-open", "finalized"],
  "submission-open": ["voting-open"],
  "voting-open": ["finalized"],
  finalized: [],
};

export function canTransitionLifecycle(
  currentState: OpenAuxLifecycleState,
  nextState: OpenAuxLifecycleState,
): boolean {
  return ALLOWED_TRANSITIONS[currentState].includes(nextState);
}
