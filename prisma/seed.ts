/**
 * Prisma seed script for OpenAux development and testing.
 * Creates realistic test data covering all lifecycle states.
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { resolve } from "path";
import {
  createUser,
  createShowcaseCreation,
  createShowcaseWithSubmissions,
  createShowcaseWithVoting,
  createFinalizedShowcase,
  createInvite,
  createParticipant,
  createShowcase,
} from "../src/test/fixtures/factories";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting OpenAux database seed...\n");

  // Clear existing data (in reverse order of foreign key dependencies)
  console.log("🧹 Clearing existing data...");
  await prisma.ballotVersion.deleteMany({});
  await prisma.ballot.deleteMany({});
  await prisma.disqualificationEvent.deleteMany({});
  await prisma.entry.deleteMany({});
  await prisma.participant.deleteMany({});
  await prisma.invite.deleteMany({});
  await prisma.transitionAuditEvent.deleteMany({});
  await prisma.showcase.deleteMany({});
  console.log("✓ Database cleared\n");

  // ======================================================================
  // 1. CREATION state showcase
  // ======================================================================
  console.log("📝 Creating CREATION state showcase...");
  const { showcase: creationShowcase, host: creationHost } =
    await createShowcaseCreation(prisma, {
      title: "Brand New Showcase - Planning Phase",
      participationScope: "PRIVATE",
      listenerScope: "PRIVATE",
      voterScope: "PRIVATE",
      blindJudgingEnabled: true,
      maxRankedPicks: 3,
    });
  console.log(
    `✓ Created: ${creationShowcase.title} (${creationShowcase.lifecycleState})`
  );

  // Create some invites for the CREATION showcase (not yet accepted)
  const creationParticipantInvite = await createInvite(prisma, {
    showcaseId: creationShowcase.id,
    scope: "PARTICIPATION",
    invitedByUserId: creationHost.id,
    invitedEmail: "participant-pending@openaux.test",
  });
  console.log(`✓ Created pending participation invite`);

  const creationVoterInvite = await createInvite(prisma, {
    showcaseId: creationShowcase.id,
    scope: "VOTER",
    invitedByUserId: creationHost.id,
    invitedEmail: "voter-pending@openaux.test",
  });
  console.log(`✓ Created pending voter invite\n`);

  // ======================================================================
  // 2. SUBMISSION_OPEN state showcase
  // ======================================================================
  console.log("📝 Creating SUBMISSION_OPEN state showcase...");
  const { showcase: submissionShowcase, host: submissionHost, participants: submissionParticipants } =
    await createShowcaseWithSubmissions(prisma, 5, {
      title: "Jazz Fusion Showcase - Submissions Open",
      participationScope: "PRIVATE",
      listenerScope: "PRIVATE",
      voterScope: "PRIVATE",
      blindJudgingEnabled: true,
      maxRankedPicks: 5,
    });
  console.log(
    `✓ Created: ${submissionShowcase.title} (${submissionShowcase.lifecycleState})`
  );
  console.log(`✓ Added ${submissionParticipants.length} participants with entries\n`);

  // Add some invites
  await createInvite(prisma, {
    showcaseId: submissionShowcase.id,
    scope: "LISTENER",
    invitedByUserId: submissionHost.id,
    invitedEmail: "listener-accepted@openaux.test",
    acceptedByUserId: createUser({ name: "Accepted Listener" }).id,
    acceptedAt: new Date(),
  });
  console.log(`✓ Created accepted listener invite`);

  // ======================================================================
  // 3. VOTING_OPEN state showcase
  // ======================================================================
  console.log("\n📝 Creating VOTING_OPEN state showcase...");
  const { showcase: votingShowcase, host: votingHost, participants: votingParticipants, voters: votingVoters, ballots: votingBallots } =
    await createShowcaseWithVoting(prisma, 4, 6, {
      title: "Electronic Music Showcase - Voting Phase",
      participationScope: "PRIVATE",
      listenerScope: "PUBLIC",
      voterScope: "PRIVATE",
      blindJudgingEnabled: true,
      maxRankedPicks: 4,
    });
  console.log(
    `✓ Created: ${votingShowcase.title} (${votingShowcase.lifecycleState})`
  );
  console.log(`✓ Added ${votingParticipants.length} participants with entries`);
  console.log(
    `✓ Added ${votingVoters.length} voters with ${votingBallots.length} ballots\n`
  );

  // ======================================================================
  // 4. FINALIZED state showcase
  // ======================================================================
  console.log("📝 Creating FINALIZED state showcase...");
  const { showcase: finalizedShowcase, host: finalizedHost, participants: finalizedParticipants, voters: finalizedVoters, ballots: finalizedBallots } =
    await createFinalizedShowcase(prisma, 3, 4, {
      title: "Classic Covers Showcase - Results Published",
      participationScope: "PUBLIC",
      listenerScope: "PUBLIC",
      voterScope: "PUBLIC",
      blindJudgingEnabled: false,
      maxRankedPicks: 3,
    });
  console.log(
    `✓ Created: ${finalizedShowcase.title} (${finalizedShowcase.lifecycleState})`
  );
  console.log(`✓ Added ${finalizedParticipants.length} participants with entries`);
  console.log(
    `✓ Added ${finalizedVoters.length} voters with ${finalizedBallots.length} ballots\n`
  );

  // ======================================================================
  // 5. VOIDED state showcase
  // ======================================================================
  console.log("📝 Creating VOIDED state showcase...");
  const voidedShowcase = await createShowcase(prisma, {
    title: "Experimental Showcase - Voided Due to Technical Issues",
    hostUserId: createUser({ name: "Voided Host" }).id,
    lifecycleState: "VOIDED",
    participationScope: "PRIVATE",
    listenerScope: "PRIVATE",
    voterScope: "PRIVATE",
  });
  console.log(`✓ Created: ${voidedShowcase.title} (${voidedShowcase.lifecycleState})\n`);

  // ======================================================================
  // 6. CANCELED state showcase
  // ======================================================================
  console.log("📝 Creating CANCELED state showcase...");
  const canceledShowcase = await createShowcase(prisma, {
    title: "Postponed Showcase - Canceled Indefinitely",
    hostUserId: createUser({ name: "Canceled Host" }).id,
    lifecycleState: "CANCELED",
    participationScope: "PRIVATE",
    listenerScope: "PRIVATE",
    voterScope: "PRIVATE",
  });
  console.log(
    `✓ Created: ${canceledShowcase.title} (${canceledShowcase.lifecycleState})\n`
  );

  // ======================================================================
  // Summary
  // ======================================================================
  console.log("✅ Seed complete!\n");
  console.log("Summary of created showcases:");
  console.log(`  • CREATION: ${creationShowcase.title}`);
  console.log(`  • SUBMISSION_OPEN: ${submissionShowcase.title}`);
  console.log(`  • VOTING_OPEN: ${votingShowcase.title}`);
  console.log(`  • FINALIZED: ${finalizedShowcase.title}`);
  console.log(`  • VOIDED: ${voidedShowcase.title}`);
  console.log(`  • CANCELED: ${canceledShowcase.title}`);
  console.log(
    "\nYou can now query these showcases in your application tests and development."
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
