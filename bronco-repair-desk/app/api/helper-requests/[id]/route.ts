import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/current-user";
import { updateHelperRequestSchema } from "@/lib/schemas/community/helper-requests";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { helperOfferRepository } from "@/lib/db/community/helper-offer-repository";
import { conversationRepository } from "@/lib/db/community/conversation-repository";
import { buildContextSnapshot } from "@/lib/services/community/context-snapshot";
import { updateHelperRequest } from "@/lib/services/community/helper-request-service";
import { store } from "@/lib/db/community/store";
import type { CasePublicSummary, HelperRequestPermissions } from "@/lib/types/community";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(req);

    const request = helperRequestRepository.findById(id);
    if (!request) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const caseRow = store.cases.get(request.case_id);
    const caseSummary: CasePublicSummary = caseRow
      ? {
          id: caseRow.id,
          category: caseRow.category,
          title: caseRow.title,
          symptoms: caseRow.symptoms,
          urgency: caseRow.urgency,
        }
      : {
          id: request.case_id,
          category: request.category,
          title: request.title,
          symptoms: null,
          urgency: request.urgency,
        };

    const { diagnosisSnapshot, verdictSnapshot, actionPlanSnapshot } =
      buildContextSnapshot(request.case_id, request.run_id);

    const isOwner = request.user_id === userId;
    const isParticipant =
      request.accepted_offer_id !== null &&
      helperOfferRepository
        .findByRequest(id)
        .some(
          (o) => o.helper_user_id === userId && o.status === "accepted"
        );

    const permissions: HelperRequestPermissions = {
      is_owner: isOwner,
      can_offer: !isOwner && request.status === "open",
      can_message:
        isOwner || isParticipant,
      can_close: isOwner,
    };

    const response: Record<string, unknown> = {
      helper_request: request,
      case_summary: caseSummary,
      diagnosis_context: diagnosisSnapshot,
      verdict_context: verdictSnapshot,
      action_plan_context: actionPlanSnapshot,
      permissions,
    };

    if (isOwner || isParticipant) {
      response.offers = helperOfferRepository.findByRequest(id);

      let conversation = null;
      if (request.accepted_offer_id) {
        conversation = conversationRepository.findByOfferPair(
          request.accepted_offer_id
        );
      }
      response.conversation = conversation;
    }

    return NextResponse.json(response);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = getCurrentUserId(req);

    const body = await req.json().catch(() => ({}));
    const parsed = updateHelperRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid request", details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const updated = updateHelperRequest(id, userId, parsed.data);
    return NextResponse.json({ helper_request: updated });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return NextResponse.json(
      { error: e.message ?? "internal server error" },
      { status: e.status ?? 500 }
    );
  }
}
