import { NextResponse } from "next/server";
import { evaluateInviteAcceptPolicy } from "@/src/modules/policy/public";
import {
  POLICY_INVITE_ACCEPT_REQUEST_SCHEMA,
  type PolicyInviteAcceptResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_INVITE_ACCEPT_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateInviteAcceptPolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const responseBody: PolicyInviteAcceptResponse = {
    ok: true,
    data: {
      canAcceptInvite: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
