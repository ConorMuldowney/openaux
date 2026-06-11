import type { ShowcaseLifecycleState } from "@/src/modules/lifecycle/public";

export type VisibilityContext = {
  isBlindJudgingEnabled: boolean;
  lifecycleState: ShowcaseLifecycleState;
};

export function shouldRevealParticipantIdentity(context: VisibilityContext): boolean {
  if (!context.isBlindJudgingEnabled) {
    return true;
  }

  return context.lifecycleState === "finalized";
}

export function shouldRevealVotingResults(context: Pick<VisibilityContext, "lifecycleState">): boolean {
  return context.lifecycleState === "finalized";
}
