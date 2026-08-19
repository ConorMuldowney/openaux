# OpenAux

OpenAux is a platform where hosts run time-boxed showcases using optional reference samples, and audiences listen and vote under configured access scopes.

## Language

**Showcase**:
A time-boxed music showcase with submission and voting phases.
Legacy references to "battle" should be interpreted as showcase and phased out.
_Avoid_: Battle, contest, challenge, event

**Host**:
An authenticated user with a verified email who creates and configures a showcase.
_Avoid_: Admin, organizer

**Participant**:
An invited authenticated user who submits one final Entry to a showcase.
_Avoid_: Competitor, producer

**Entry**:
A Participant's submitted track for a specific showcase.
_Avoid_: Song upload, submission artifact

**Reference Sample**:
Optional audio that a Host provides as creative guidance for a Showcase.
_Avoid_: Mandatory sample, bonus sample

**Invite**:
A private access grant (link or in-app) that requires authentication before acceptance.
_Avoid_: Open link, share code

**Participation Scope**:
The rule defining who can submit Entries to a showcase.
_Avoid_: Join mode, access mode

**Listener Scope**:
The rule defining who can listen to Entries.
_Avoid_: Audience visibility, stream mode

**Voter Scope**:
The rule defining which authenticated users may cast ballots.
_Avoid_: Voting audience, vote visibility

**Ranked Ballot**:
A ballot where a voter ranks up to a host-defined number of distinct Participants.
_Avoid_: Single-pick vote, rating scale

**Blind Judging**:
A mode where creator identities are hidden during active phases and revealed when results publish.
_Avoid_: Anonymous mode, secret mode

**Showcase Finalization**:
The state reached when voting closes and showcase actions become immutable.
_Avoid_: Archive, lock