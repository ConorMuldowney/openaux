import type { PrismaClient, ShowcaseLifecycleState } from "@prisma/client";

type ScheduledShowcase = {
  id: string;
  lifecycleState: ShowcaseLifecycleState;
  submissionOpensAt: Date | null;
  votingOpensAt: Date | null;
};

function nextScheduledState(showcase: ScheduledShowcase, now: Date): ShowcaseLifecycleState | null {
  if (
    showcase.lifecycleState === "CREATION" &&
    showcase.submissionOpensAt !== null &&
    showcase.submissionOpensAt <= now
  ) {
    return "SUBMISSION_OPEN";
  }

  if (
    showcase.lifecycleState === "SUBMISSION_OPEN" &&
    showcase.votingOpensAt !== null &&
    showcase.votingOpensAt <= now
  ) {
    return "VOTING_OPEN";
  }

  return null;
}

export async function reconcileScheduledLifecycle(
  prisma: PrismaClient,
  initialShowcase: ScheduledShowcase,
  now = new Date(),
): Promise<ShowcaseLifecycleState | null> {
  let showcase: ScheduledShowcase | null = initialShowcase;

  for (;;) {
    const nextState = nextScheduledState(showcase, now);
    if (nextState === null) {
      return showcase.lifecycleState;
    }

    const currentShowcase = showcase;
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.showcase.updateMany({
        where: {
          id: currentShowcase.id,
          lifecycleState: currentShowcase.lifecycleState,
        },
        data: { lifecycleState: nextState },
      });

      if (result.count === 0) {
        return result;
      }

      await tx.transitionAuditEvent.create({
        data: {
          showcaseId: currentShowcase.id,
          fromState: currentShowcase.lifecycleState,
          toState: nextState,
          reason: "Scheduled lifecycle transition.",
          metadata: { trigger: "schedule" },
        },
      });

      return result;
    });

    if (updated.count === 0) {
      showcase = await prisma.showcase.findUnique({
        where: { id: initialShowcase.id },
        select: {
          id: true,
          lifecycleState: true,
          submissionOpensAt: true,
          votingOpensAt: true,
        },
      });

      if (!showcase) {
        return null;
      }

      if (showcase.lifecycleState === currentShowcase.lifecycleState) {
        return showcase.lifecycleState;
      }

      continue;
    }

    showcase = { ...showcase, lifecycleState: nextState };
  }
}