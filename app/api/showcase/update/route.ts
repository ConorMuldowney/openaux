import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import {
  SHOWCASE_UPDATE_REQUEST_SCHEMA,
  type ShowcaseUpdateResponse,
  type ShowcaseUpdateData,
} from "@/src/api/contracts/showcase";
import { parseJsonBody, settingsLockedResponse, stateInvalidResponse } from "@/src/api/route-handler";
import { fromPrismaLifecycleState, canUpdateShowcaseField } from "@/src/modules/lifecycle/public";
import { observeSignal } from "@/src/observability/server";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, SHOWCASE_UPDATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedRequest.data.showcaseId },
    select: {
      id: true,
      hostUserId: true,
      lifecycleState: true,
    },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Showcase '${parsedRequest.data.showcaseId}' does not exist.`,
    );
  }

  if (showcase.hostUserId !== authResult.session.user.sub) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "policy-denied",
          message: "Only the Host of this Showcase may perform this action.",
          details: {
            policyDenialReason: "host-membership-required",
          },
        },
      },
      { status: 403 },
    );
  }

  const currentState = fromPrismaLifecycleState(showcase.lifecycleState);
  if (!currentState) {
    return stateInvalidResponse(
      `Cannot update showcase: unsupported persisted lifecycle state '${showcase.lifecycleState}'.`,
    );
  }

  // Map update request fields to lifecycle rule fields
  const fieldMap: Record<
    keyof Exclude<typeof parsedRequest.data.updates, undefined>,
    import("@/src/modules/lifecycle/public").ShowcaseRuleField
  > = {
    voterScope: "voter-scope",
    blindJudgingEnabled: "blind-judging",
    maxRankedPicks: "max-ranked-picks",
    listenerScope: "listener-scope",
  };

  const updates = parsedRequest.data.updates;
  const lockedFields: string[] = [];
  const allowedUpdateFields: Record<string, boolean> = {};

  // Validate which fields can be updated
  for (const [updateField, lifecycleField] of Object.entries(fieldMap)) {
    if (updateField in updates) {
      const validation = canUpdateShowcaseField(currentState, lifecycleField);
      if (!validation.allowed) {
        lockedFields.push(updateField);
      } else {
        allowedUpdateFields[updateField] = true;
      }
    }
  }

  // If any fields are locked, return error
  if (lockedFields.length > 0) {
    observeSignal({
      name: "showcase.update.locked-fields-attempted",
      level: "warn",
      context: {
        route: "/api/showcase/update",
        showcaseId: parsedRequest.data.showcaseId,
        actorUserId: authResult.session.user.sub,
        lifecycleState: currentState,
        lockedFields,
      },
    });

    return settingsLockedResponse(
      `Cannot update showcase at '${currentState}' state. The following fields are locked: ${lockedFields.join(", ")}.`,
    );
  }

  // Build update payload with only allowed fields
  const updatePayload: Record<string, unknown> = {};

  if ("voterScope" in updates && updates.voterScope) {
    const voterScopeMap: Record<string, "PUBLIC" | "PRIVATE"> = {
      "public-authenticated": "PUBLIC",
      "invite-only-authenticated": "PRIVATE",
    };
    updatePayload.voterScope = voterScopeMap[updates.voterScope] || updates.voterScope;
  }

  if ("listenerScope" in updates && updates.listenerScope) {
    const listenerScopeMap: Record<string, "PUBLIC" | "PRIVATE"> = {
      public: "PUBLIC",
      "invite-only": "PRIVATE",
    };
    updatePayload.listenerScope = listenerScopeMap[updates.listenerScope] || updates.listenerScope;
  }

  if ("blindJudgingEnabled" in updates && updates.blindJudgingEnabled !== undefined) {
    updatePayload.blindJudgingEnabled = updates.blindJudgingEnabled;
  }

  if ("maxRankedPicks" in updates && updates.maxRankedPicks !== undefined) {
    updatePayload.maxRankedPicks = updates.maxRankedPicks;
  }

  // Apply updates if there are any
  if (Object.keys(updatePayload).length > 0) {
    try {
      await prisma.showcase.update({
        where: { id: parsedRequest.data.showcaseId },
        data: updatePayload,
      });

      observeSignal({
        name: "showcase.settings.updated",
        context: {
          route: "/api/showcase/update",
          showcaseId: parsedRequest.data.showcaseId,
          actorUserId: authResult.session.user.sub,
          lifecycleState: currentState,
          updatedFields: Object.keys(updatePayload),
        },
      });
    } catch (error) {
      observeSignal({
        name: "showcase.update.failed",
        level: "error",
        context: {
          route: "/api/showcase/update",
          showcaseId: parsedRequest.data.showcaseId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return stateInvalidResponse(
        "Failed to update showcase settings. Please try again.",
      );
    }
  }

  const responseBody: ShowcaseUpdateResponse = {
    ok: true,
    data: {
      showcaseId: parsedRequest.data.showcaseId,
      updated: allowedUpdateFields,
    } as ShowcaseUpdateData,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
