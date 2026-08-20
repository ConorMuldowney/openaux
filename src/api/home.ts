import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import {
  SHOWCASE_DETAIL_SELECT,
  toShowcaseDetailData,
  type ShowcaseDetailRecord,
} from "@/src/api/showcases";
import { buildHomeShowcaseWhere } from "@/src/api/showcase-read-access";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

const TREND_DAYS = 30;

// Populated by the Auth0 Post-Login Action; not part of the default ID token claims.
const AUTH0_USERNAME_CLAIM = "https://openaux.net/username";
const DISPLAY_NAME_FIELDS = ["nickname", "name", "email"] as const;

type HomeSessionUser = {
  sub: string;
  nickname?: string;
  name?: string;
  email?: string;
  [AUTH0_USERNAME_CLAIM]?: unknown;
};

export type HomeShowcaseData = ShowcaseDetailData & {
  relationship: "hosting" | "participating";
};

export type HomeTrendPoint = {
  date: string;
  showcases: number;
  submissions: number;
  voted: number;
};

export type HomePageData = {
  displayName: string;
  showcases: HomeShowcaseData[];
  totalShowcases: number;
  activeShowcases: number;
  completedShowcases: number;
  totalSubmissions: number;
  trend: HomeTrendPoint[];
};

function getDisplayName(user: HomeSessionUser): string {
  const username = user[AUTH0_USERNAME_CLAIM];

  if (typeof username === "string") {
    return username;
  }

  for (const key of DISPLAY_NAME_FIELDS) {
    const value = user[key];
    if (typeof value === "string") {
      return value;
    }
  }

  return "there";
}

function bucketByDay(timestamps: Date[], dayStarts: Date[]): number[] {
  return dayStarts.map(
    (dayStart) => timestamps.filter((timestamp) => timestamp >= dayStart && timestamp <= endOfDay(dayStart)).length,
  );
}

async function getHomeTrendData(userId: string): Promise<HomeTrendPoint[]> {
  const now = new Date();
  const dayStarts = Array.from({ length: TREND_DAYS }, (_, index) =>
    startOfDay(subDays(now, TREND_DAYS - 1 - index)),
  );
  const rangeStart = dayStarts[0];

  const [showcaseRows, entryRows, ballotRows] = await Promise.all([
    prisma.showcase.findMany({
      where: { hostUserId: userId, createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
    prisma.entry.findMany({
      where: { participant: { userId }, submittedAt: { gte: rangeStart } },
      select: { submittedAt: true },
    }),
    prisma.ballot.findMany({
      where: { voterUserId: userId, createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
  ]);

  const showcaseCounts = bucketByDay(
    showcaseRows.map((row) => row.createdAt),
    dayStarts,
  );
  const submissionCounts = bucketByDay(
    entryRows.map((row) => row.submittedAt),
    dayStarts,
  );
  const votedCounts = bucketByDay(
    ballotRows.map((row) => row.createdAt),
    dayStarts,
  );

  return dayStarts.map((dayStart, index) => ({
    date: format(dayStart, "MMM d"),
    showcases: showcaseCounts[index],
    submissions: submissionCounts[index],
    voted: votedCounts[index],
  }));
}

export async function getHomePageData(): Promise<HomePageData | null> {
  const session = await auth0.getSession();

  if (!session) {
    return null;
  }

  const userId = session.user.sub;
  const showcases = await prisma.showcase.findMany({
    where: buildHomeShowcaseWhere(userId),
    select: SHOWCASE_DETAIL_SELECT,
    orderBy: { createdAt: "desc" },
  });

  const [trend, totalSubmissions] = await Promise.all([
    getHomeTrendData(userId),
    prisma.entry.count({ where: { participant: { userId } } }),
  ]);

  const totalShowcases = showcases.filter(
    (showcase: ShowcaseDetailRecord) => showcase.hostUserId === userId,
  ).length;
  const activeShowcases = showcases.filter((showcase: ShowcaseDetailRecord) =>
    showcase.lifecycleState === "SUBMISSION_OPEN" || showcase.lifecycleState === "VOTING_OPEN",
  ).length;
  const completedShowcases = showcases.filter(
    (showcase: ShowcaseDetailRecord) => showcase.lifecycleState === "FINALIZED",
  ).length;

  return {
    displayName: getDisplayName(session.user),
    showcases: showcases.map((showcase: ShowcaseDetailRecord) => {
      const data = toShowcaseDetailData(showcase);

      return {
        ...data,
        relationship: data.hostUserId === userId ? "hosting" : "participating",
      };
    }),
    totalShowcases,
    activeShowcases,
    completedShowcases,
    totalSubmissions,
    trend,
  };
}