import { NextResponse } from "next/server";
import { MODULE_BOUNDARIES } from "@/src/modules/module-boundaries";

export async function GET() {
  return NextResponse.json({
    service: "openaux",
    status: "ok",
    modules: MODULE_BOUNDARIES.map((moduleBoundary) => moduleBoundary.moduleName),
  });
}
