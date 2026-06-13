import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ShowcaseListResponse } from "@/src/api/contracts/showcases";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { SHOWCASE_DETAIL_SELECT, toShowcaseDetailData } from "@/src/api/showcases";
import { buildShowcaseReadWhere } from "@/src/api/showcase-read-access";

export async function GET(request: Request) {
  const session = await auth0.getSession(request as NextRequest);
  const userId = session?.user.sub;

  const showcases = await prisma.showcase.findMany({
    where: buildShowcaseReadWhere(userId),
    select: SHOWCASE_DETAIL_SELECT,
    orderBy: { createdAt: "desc" },
  });

  const responseBody: ShowcaseListResponse = {
    ok: true,
    data: {
      showcases: showcases.map(toShowcaseDetailData),
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
