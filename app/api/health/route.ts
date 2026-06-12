import { NextResponse } from "next/server";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";

export async function GET() {
  return NextResponse.json({
    service: "openaux",
    status: "ok",
    modules: MODULE_BOUNDARIES.map((moduleBoundary) => moduleBoundary.moduleName),
    uptimeChecks: [
      {
        path: "/api/health",
        method: "GET",
        expectedStatuses: [200],
      },
      {
        path: "/api/policy/vote",
        method: "POST",
        expectedStatuses: [200, 403],
      },
      {
        path: "/api/lifecycle/transition",
        method: "POST",
        expectedStatuses: [401],
      },
      {
        path: "/api/scoring/final-standings",
        method: "POST",
        expectedStatuses: [401],
      },
    ],
  });
}
