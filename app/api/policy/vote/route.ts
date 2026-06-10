import { NextResponse } from "next/server";
import { evaluateVotePolicy } from "@/src/modules/policy/public";
import {
  POLICY_VOTE_REQUEST_SCHEMA,
  type PolicyVoteResponse,
} from "@/src/api/contracts/policy";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, POLICY_VOTE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateVotePolicy(parsedRequest.data);
  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const responseBody: PolicyVoteResponse = {
    ok: true,
    data: {
      canVote: true,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
