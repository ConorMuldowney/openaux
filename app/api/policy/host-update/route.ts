import { NextResponse } from "next/server";
import { evaluateHostUpdatePolicy } from "@/src/modules/policy/public";
import {
  POLICY_HOST_UPDATE_REQUEST_SCHEMA,
  type PolicyHostUpdateResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_HOST_UPDATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateHostUpdatePolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const responseBody: PolicyHostUpdateResponse = {
    ok: true,
    data: {
      canUpdateHost: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
