# Database Seeding and Test Fixtures

This directory contains factory helper functions for creating test data and a Prisma seed script for development.

## Quick Start

### Seed the Development Database

```bash
npm run db:seed
```

This creates realistic test data covering all showcase lifecycle states:
- **CREATION**: Empty showcase in planning phase
- **SUBMISSION_OPEN**: Showcase with participants and entries
- **VOTING_OPEN**: Showcase with participants, entries, and ballots
- **FINALIZED**: Showcase with voting results published
- **VOIDED**: Showcase marked as voided
- **CANCELED**: Showcase marked as canceled

## Factory Functions

The factory functions in [factories.ts](factories.ts) allow you to create test data in Vitest and Playwright tests.

### Basic Factories

#### `createUser(overrides?)`
Create a user object for testing.

```typescript
const user = createUser({ name: "John Doe" });
// Returns: { id: "...", name: "John Doe", email: "john.doe@openaux.test" }
```

#### `createShowcase(prisma, overrides?)`
Create a single showcase in the database.

```typescript
const showcase = await createShowcase(prisma, {
  title: "My Showcase",
  lifecycleState: "CREATION",
  participationScope: "PRIVATE",
});
```

#### `createParticipant(prisma, input)`
Create a participant for a showcase.

```typescript
const participant = await createParticipant(prisma, {
  showcaseId: showcase.id,
  userId: user.id,
});
```

#### `createEntry(prisma, input)`
Create an entry (track submission) for a participant.

```typescript
const entry = await createEntry(prisma, {
  showcaseId: showcase.id,
  participantId: participant.id,
});
```

#### `createBallot(prisma, input)` & `createBallotVersion(prisma, input)`
Create ballots and ballot versions for voting.

```typescript
const ballot = await createBallot(prisma, {
  showcaseId: showcase.id,
  voterUserId: voter.id,
});

const version = await createBallotVersion(prisma, {
  ballotId: ballot.id,
  versionNumber: 1,
  rankedParticipantIds: [participant1.id, participant2.id],
});
```

#### `createInvite(prisma, input)`
Create an invite for a showcase scope (PARTICIPATION, LISTENER, VOTER).

```typescript
const invite = await createInvite(prisma, {
  showcaseId: showcase.id,
  scope: "PARTICIPATION",
  invitedByUserId: hostUser.id,
  invitedEmail: "participant@example.com",
});
```

### Composite Factories

These create complete showcase scenarios with all related data.

#### `createShowcaseCreation(prisma, overrides?)`
Create a showcase in CREATION state with a host.

```typescript
const { showcase, host } = await createShowcaseCreation(prisma, {
  title: "Planning Showcase",
});
```

#### `createShowcaseWithSubmissions(prisma, participantCount?, overrides?)`
Create a showcase in SUBMISSION_OPEN state with participants and entries.

```typescript
const { showcase, host, participants } = await createShowcaseWithSubmissions(
  prisma,
  5, // 5 participants
  { title: "Submission Phase Showcase" }
);
```

#### `createShowcaseWithVoting(prisma, participantCount?, voterCount?, overrides?)`
Create a showcase in VOTING_OPEN state with participants, entries, and ballots.

```typescript
const { showcase, host, participants, voters, ballots } =
  await createShowcaseWithVoting(
    prisma,
    4, // 4 participants
    6, // 6 voters
    { title: "Voting Phase Showcase" }
  );
```

#### `createFinalizedShowcase(prisma, participantCount?, voterCount?, overrides?)`
Create a finalized showcase with all voting complete.

```typescript
const { showcase, host, participants, voters, ballots } =
  await createFinalizedShowcase(
    prisma,
    3, // 3 participants
    4  // 4 voters
  );
```

## Usage in Tests

### Vitest Example

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createShowcaseWithVoting } from "@/test/fixtures/factories";

describe("Voting API", () => {
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("should fetch ballots for a voting showcase", async () => {
    const { showcase, ballots } = await createShowcaseWithVoting(prisma);

    const response = await fetch(
      `/api/showcases/${showcase.id}/ballots`
    );
    const data = await response.json();

    expect(data).toHaveLength(ballots.length);
  });
});
```

### Playwright Test Example

```typescript
import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { createShowcaseWithVoting } from "@/test/fixtures/factories";

test.describe("Voting UI", () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test("should render voting interface for active showcase", async ({
    page,
  }) => {
    const { showcase } = await createShowcaseWithVoting(prisma);

    await page.goto(`/showcases/${showcase.id}/vote`);
    await expect(page.locator("button:has-text('Cast Ballot')")).toBeVisible();
  });
});
```

## Seed Script Implementation

The seed script ([seed.ts](seed.ts)):
1. Loads environment variables from `.env.local`
2. Clears all data (for idempotent re-runs)
3. Creates showcases for each lifecycle state
4. Creates realistic participants, entries, ballots, and invites
5. Logs progress and summary

The script is automatically wired to run with `npm run db:seed` and can also be triggered during `prisma migrate dev`.

## Environment Setup

The `.env.local` file must include a valid `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:5432/openaux"
```

For Neon setup, see [docs/setup/neon-prisma.md](../../../docs/setup/neon-prisma.md).

## Design Principles

- **Composability**: Factories build upon each other (e.g., `createShowcaseWithVoting` uses the participant/entry creation logic)
- **Realism**: Generated data mimics real-world showcase scenarios with realistic counts and configurations
- **Determinism**: Using factories in tests ensures reproducible test data
- **Type Safety**: All factories are fully typed with TypeScript
- **Flexibility**: Overrides allow customization of any default value
