import { NextResponse } from "next/server";
import { isEntryValidForRequiredSamples } from "@/src/modules/submissions/public";
import {
  SUBMISSIONS_REQUIRED_SAMPLE_REQUEST_SCHEMA,
  type SubmissionsRequiredSampleResponse,
} from "@/src/api/contracts/submissions";
import { parseJsonBody } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, SUBMISSIONS_REQUIRED_SAMPLE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const isEntryValid = isEntryValidForRequiredSamples(parsedRequest.data);

  const responseBody: SubmissionsRequiredSampleResponse = {
    ok: true,
    data: {
      isEntryValid,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
