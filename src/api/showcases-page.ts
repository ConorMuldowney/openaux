import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import {
  SHOWCASE_DETAIL_SELECT,
  toShowcaseDetailData,
  type ShowcaseDetailRecord,
} from "@/src/api/showcases";
import { buildShowcaseReadWhere } from "@/src/api/showcase-read-access";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

export type ShowcasesPageData = {
  userId: string;
  showcases: ShowcaseDetailData[];
};

export async function getShowcasesPageData(): Promise<ShowcasesPageData | null> {
  const session = await auth0.getSession();

  if (!session) {
    return null;
  }

  const userId = session.user.sub;
  const showcases = await prisma.showcase.findMany({
    where: buildShowcaseReadWhere(userId),
    select: SHOWCASE_DETAIL_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return {
    userId,
    showcases: showcases.map((showcase: ShowcaseDetailRecord) => toShowcaseDetailData(showcase)),
  };
}
