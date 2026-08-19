export const CANONICAL_DOMAIN_TERMS = [
  "Showcase",
  "Host",
  "Participant",
  "Entry",
  "Reference Sample",
  "Invite",
  "Participation Scope",
  "Listener Scope",
  "Voter Scope",
  "Ranked Ballot",
  "Blind Judging",
  "Showcase Finalization",
] as const;

export const NON_CANONICAL_LEGACY_TERMS = [
  "battle",
  "contest",
  "challenge",
  "event",
  "admin",
  "organizer",
  "competitor",
] as const;

export type CanonicalDomainTerm = (typeof CANONICAL_DOMAIN_TERMS)[number];
