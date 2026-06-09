export type ModuleBoundary = {
  moduleName:
    | "lifecycle"
    | "policy"
    | "submissions"
    | "ballots"
    | "scoring"
    | "visibility";
  responsibility: string;
};

export const MODULE_BOUNDARIES: readonly ModuleBoundary[] = [
  {
    moduleName: "lifecycle",
    responsibility:
      "Owns Open Aux lifecycle states, guarded transitions, and finalization invariants.",
  },
  {
    moduleName: "policy",
    responsibility:
      "Owns Participation Scope, Listener Scope, and Voter Scope eligibility decisions.",
  },
  {
    moduleName: "submissions",
    responsibility:
      "Owns Entry draft replacement, Required Sample completeness, and valid Entry checks.",
  },
  {
    moduleName: "ballots",
    responsibility:
      "Owns Ranked Ballot validation including max picks, unique participants, and contiguous ranks.",
  },
  {
    moduleName: "scoring",
    responsibility:
      "Owns deterministic tally behavior for Ranked Ballots and tie-break ordering.",
  },
  {
    moduleName: "visibility",
    responsibility:
      "Owns identity reveal behavior based on Blind Judging and lifecycle state.",
  },
] as const;
