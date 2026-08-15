import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import {
  SHOWCASE_DETAIL_SELECT,
  toShowcaseDetailData,
  type ShowcaseDetailRecord,
} from "@/src/api/showcases";
import { buildHomeShowcaseWhere } from "@/src/api/showcase-read-access";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

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

export type HomePageData = {
  displayName: string;
  showcases: HomeShowcaseData[];
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

  return {
    displayName: getDisplayName(session.user),
    showcases: showcases.map((showcase: ShowcaseDetailRecord) => {
      const data = toShowcaseDetailData(showcase);

      return {
        ...data,
        relationship: data.hostUserId === userId ? "hosting" : "participating",
      };
    }),
  };
}