import type { OpenAuxLifecycleState } from "@/src/modules/lifecycle/public";

export type VisibilityContext = {
  isBlindJudgingEnabled: boolean;
  lifecycleState: OpenAuxLifecycleState;
};

export function shouldRevealParticipantIdentity(context: VisibilityContext): boolean {
  if (!context.isBlindJudgingEnabled) {
    return true;
  }

  return context.lifecycleState === "finalized";
}
