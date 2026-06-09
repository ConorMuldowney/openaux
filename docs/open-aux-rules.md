# OpenAux Showcase Rules

This document captures the agreed product rules for showcases in OpenAux. It is intended as an implementation and product handoff, not a glossary.

## Access and identity

- Hosting requires an authenticated account with a verified email.
- Voting requires an authenticated account with a verified email.
- Accepting an invite requires the user to be authenticated before they can accept it.
- Public listening can be anonymous or authenticated.
- Private listening is invite-only.

## Showcase participation and scopes

- A showcase has participation scope, listener scope, voter scope, and blind-judging scope.
- Private participation means only explicitly invited users, via link or in-app invite, may submit entries.
- Public listeners may be anyone, authenticated or anonymous.
- Private listeners are invite-only.
- Public voters are any authenticated users.
- Private voters are authenticated invited users.
- Participants cannot vote in the same showcase they entered.

## Rule locking

- Voting-related settings lock when submissions open.
- Blind judging is host-configurable and defaults on.
- Blind judging also locks when submissions open.
- Listener settings can change at any stage.

## Submissions

- Each participant may submit exactly one final entry per showcase.
- Participants may replace their draft submission until submission closes; the latest version counts.
- Each showcase must define at least one required sample.
- An entry is valid only if it uses all required samples.
- Additional samples may be optional bonus material.
- If fewer than two valid entries exist at submission close, the showcase is void and no voting phase begins.

## Voting model

- Voting uses ranked ballots.
- The host can define the maximum number of ranked picks per voter.
- A voter may rank each Participant at most once on a ballot.
- Partial ballots are allowed.
- Ranks must be contiguous from 1 through k with no gaps.
- Scoring uses Borda-style points for ranked picks.
- If the host allows top N picks, rank 1 gets N points, rank 2 gets N-1 points, and so on.
- Ballots and totals stay hidden until voting closes.
- Voters may edit their ballot until voting closes.
- Only the latest ballot counts.
- There is no voter cap in public voting mode.

## Tie-breaking and disqualification

- Tie-break order is: more first-rank votes, then more second-rank votes, then more third-rank votes, and so on.
- If entries are still tied after all ranks, the earlier submission timestamp wins.
- If an entry is disqualified after voting starts, remove it from final scoring.
- Preserve ballots otherwise, compress affected ranks, and recompute totals.

## Time and lifecycle

- All schedule timestamps are stored and enforced in UTC.
- Times are displayed in each viewer's local timezone.
- Window boundaries are start-inclusive and end-exclusive.
- The host may cancel a showcase only before voting opens.
- The host may extend submission close only while submissions are open and before voting starts.
- Submissions cannot be reopened after close.
- The host may extend voting close only while voting is open.
- After voting closes, the showcase is finalized and immutable.
- Invite links become read-only after finalization.

## Visibility and reveal

- Blind judging hides creator identities during active phases.
- Creator identities are revealed when results publish.
- Participant identities may be hidden by default during submission and voting when blind judging is enabled.

## Deferred area

- Fraud and account-manipulation handling is intentionally deferred.