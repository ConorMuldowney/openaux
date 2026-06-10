import { NextResponse } from "next/server";
import { canSubmitEntry } from "@/src/modules/policy/public";
import {
  POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA,
  type PolicySubmitEntryResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const allowed = canSubmitEntry(parsedRequest.data);
  if (!allowed) {
    return policyDeniedResponse(
      "Current requester is not allowed to submit an Entry under this Participation Scope.",
    );
  }

  const responseBody: PolicySubmitEntryResponse = {
    ok: true,
    data: {
      canSubmitEntry: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
