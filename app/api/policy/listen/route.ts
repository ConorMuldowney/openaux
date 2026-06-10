import { NextResponse } from "next/server";
import { evaluateListenPolicy } from "@/src/modules/policy/public";
import {
  POLICY_LISTEN_REQUEST_SCHEMA,
  type PolicyListenResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_LISTEN_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateListenPolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const responseBody: PolicyListenResponse = {
    ok: true,
    data: {
      canListen: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
