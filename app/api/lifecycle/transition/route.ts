import { NextResponse } from "next/server";
import { canTransitionLifecycle } from "@/src/modules/lifecycle/public";
import {
  LIFECYCLE_TRANSITION_REQUEST_SCHEMA,
  type LifecycleTransitionResponse,
} from "@/src/api/contracts/lifecycle";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, LIFECYCLE_TRANSITION_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const canTransition = canTransitionLifecycle(
    parsedRequest.data.currentState,
    parsedRequest.data.nextState,
  );

  if (!canTransition) {
    return stateInvalidResponse(
      `Cannot transition showcase lifecycle from '${parsedRequest.data.currentState}' to '${parsedRequest.data.nextState}'.`,
    );
  }

  const responseBody: LifecycleTransitionResponse = {
    ok: true,
    data: {
      canTransition,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
