import { NextResponse } from "next/server";
import type { ShowcaseSampleDownloadUrlResponse } from "@/src/api/contracts/showcases";
import { SHOWCASE_SAMPLE_DOWNLOAD_URL_REQUEST_SCHEMA } from "@/src/api/contracts/showcases";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { createSampleDownloadUrl } from "@/src/storage/public";

// Lets a Host preview a previously uploaded required-sample while editing a Showcase.
export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request, SHOWCASE_SAMPLE_DOWNLOAD_URL_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const download = await createSampleDownloadUrl(parsedBody.data.storageKey);
  if (!download) {
    return stateInvalidResponse(
      `Cannot create a download URL because '${parsedBody.data.storageKey}' is not a valid sample storage key.`,
    );
  }

  const responseBody: ShowcaseSampleDownloadUrlResponse = {
    ok: true,
    data: download,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
