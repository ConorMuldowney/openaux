import { NextResponse } from "next/server";
import { evaluateHostCreatePolicy } from "@/src/modules/policy/public";
import {
  POLICY_HOST_CREATE_REQUEST_SCHEMA,
  type PolicyHostCreateResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_HOST_CREATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateHostCreatePolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason, {
      route: "/api/policy/host-create",
    });
  }

  const responseBody: PolicyHostCreateResponse = {
    ok: true,
    data: {
      canCreateHost: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
