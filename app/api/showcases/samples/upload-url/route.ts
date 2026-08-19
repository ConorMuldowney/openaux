import { NextResponse } from "next/server";
import type { ShowcaseSampleUploadUrlResponse } from "@/src/api/contracts/showcases";
import { SHOWCASE_SAMPLE_UPLOAD_URL_REQUEST_SCHEMA } from "@/src/api/contracts/showcases";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";
import { evaluateHostCreatePolicy } from "@/src/modules/policy/public";
import { createSampleUploadUrl } from "@/src/storage/public";

// Lets a Host upload required-sample audio ahead of, or independent from, a specific Showcase.
export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request, SHOWCASE_SAMPLE_UPLOAD_URL_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const decision = evaluateHostCreatePolicy({
    isAuthenticated: true,
    isVerifiedEmail: true,
  });

  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const upload = await createSampleUploadUrl({
    hostUserId: authResult.session.user.sub,
    contentType: parsedBody.data.contentType,
  });

  const responseBody: ShowcaseSampleUploadUrlResponse = {
    ok: true,
    data: upload,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
