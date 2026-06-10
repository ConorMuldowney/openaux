export type ParticipationScope = "public" | "invite-only";
export type ListenerScope = "public" | "invite-only";
export type VoterScope = "public-authenticated" | "invite-only-authenticated";

export type PolicyContext = {
  participationScope: ParticipationScope;
  listenerScope: ListenerScope;
  voterScope: VoterScope;
  isAuthenticated: boolean;
  isInvited: boolean;
  isParticipantInShowcase: boolean;
};

export type PolicyDenialReason =
  | "authentication-required"
  | "verified-email-required"
  | "host-membership-required"
  | "invite-required"
  | "participant-cannot-vote";

export type PolicyDecision =
  | { allowed: true }
  | { allowed: false; reason: PolicyDenialReason };

export type HostCreatePolicyContext = {
  isAuthenticated: boolean;
  isVerifiedEmail: boolean;
};

export type HostUpdatePolicyContext = {
  isAuthenticated: boolean;
  isVerifiedEmail: boolean;
  isHostOfShowcase: boolean;
};

export type InviteAcceptPolicyContext = {
  isAuthenticated: boolean;
};

export type SubmitEntryPolicyContext = {
  participationScope: ParticipationScope;
  isAuthenticated: boolean;
  isInvited: boolean;
};

export type ListenPolicyContext = {
  listenerScope: ListenerScope;
  isInvited: boolean;
};

export type VotePolicyContext = {
  voterScope: VoterScope;
  isAuthenticated: boolean;
  isVerifiedEmail: boolean;
  isInvited: boolean;
  isParticipantInShowcase: boolean;
};

export function evaluateHostCreatePolicy(context: HostCreatePolicyContext): PolicyDecision {
  if (!context.isAuthenticated) {
    return { allowed: false, reason: "authentication-required" };
  }

  if (!context.isVerifiedEmail) {
    return { allowed: false, reason: "verified-email-required" };
  }

  return { allowed: true };
}

export function evaluateHostUpdatePolicy(context: HostUpdatePolicyContext): PolicyDecision {
  if (!context.isAuthenticated) {
    return { allowed: false, reason: "authentication-required" };
  }

  if (!context.isVerifiedEmail) {
    return { allowed: false, reason: "verified-email-required" };
  }

  if (!context.isHostOfShowcase) {
    return { allowed: false, reason: "host-membership-required" };
  }

  return { allowed: true };
}

export function evaluateInviteAcceptPolicy(context: InviteAcceptPolicyContext): PolicyDecision {
  if (!context.isAuthenticated) {
    return { allowed: false, reason: "authentication-required" };
  }

  return { allowed: true };
}

export function evaluateSubmitEntryPolicy(context: SubmitEntryPolicyContext): PolicyDecision {
  if (!context.isAuthenticated) {
    return { allowed: false, reason: "authentication-required" };
  }

  if (context.participationScope === "invite-only" && !context.isInvited) {
    return { allowed: false, reason: "invite-required" };
  }

  return { allowed: true };
}

export function evaluateListenPolicy(context: ListenPolicyContext): PolicyDecision {
  if (context.listenerScope === "invite-only" && !context.isInvited) {
    return { allowed: false, reason: "invite-required" };
  }

  return { allowed: true };
}

export function evaluateVotePolicy(context: VotePolicyContext): PolicyDecision {
  if (!context.isAuthenticated) {
    return { allowed: false, reason: "authentication-required" };
  }

  if (!context.isVerifiedEmail) {
    return { allowed: false, reason: "verified-email-required" };
  }

  if (context.isParticipantInShowcase) {
    return { allowed: false, reason: "participant-cannot-vote" };
  }

  if (context.voterScope === "invite-only-authenticated" && !context.isInvited) {
    return { allowed: false, reason: "invite-required" };
  }

  return { allowed: true };
}

export function canSubmitEntry(context: PolicyContext): boolean {
  return evaluateSubmitEntryPolicy({
    participationScope: context.participationScope,
    isAuthenticated: context.isAuthenticated,
    isInvited: context.isInvited,
  }).allowed;
}

export function canCastRankedBallot(context: PolicyContext & { isVerifiedEmail: boolean }): boolean {
  return evaluateVotePolicy({
    voterScope: context.voterScope,
    isAuthenticated: context.isAuthenticated,
    isVerifiedEmail: context.isVerifiedEmail,
    isInvited: context.isInvited,
    isParticipantInShowcase: context.isParticipantInShowcase,
  }).allowed;
}
