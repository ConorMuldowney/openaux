import { NextResponse } from "next/server";
import { evaluateSubmitEntryPolicy } from "@/src/modules/policy/public";
import {
  POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA,
  type PolicySubmitEntryResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateSubmitEntryPolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason, {
      route: "/api/policy/submit-entry",
    });
  }

  const responseBody: PolicySubmitEntryResponse = {
    ok: true,
    data: {
      canSubmitEntry: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
