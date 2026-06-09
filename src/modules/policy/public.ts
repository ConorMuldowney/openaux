export type ParticipationScope = "public" | "invite-only";
export type ListenerScope = "public" | "invite-only";
export type VoterScope = "public-authenticated" | "invite-only-authenticated";

export type PolicyContext = {
  participationScope: ParticipationScope;
  listenerScope: ListenerScope;
  voterScope: VoterScope;
  isAuthenticated: boolean;
  isInvited: boolean;
  isParticipantInOpenAux: boolean;
};

export function canSubmitEntry(context: PolicyContext): boolean {
  if (!context.isAuthenticated) {
    return false;
  }

  if (context.participationScope === "public") {
    return true;
  }

  return context.isInvited;
}

export function canCastRankedBallot(context: PolicyContext): boolean {
  if (!context.isAuthenticated || context.isParticipantInOpenAux) {
    return false;
  }

  if (context.voterScope === "public-authenticated") {
    return true;
  }

  return context.isInvited;
}
