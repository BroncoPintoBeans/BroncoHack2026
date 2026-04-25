import { randomUUID } from "crypto";
import { store } from "@/lib/db/community/store";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { helperOfferRepository } from "@/lib/db/community/helper-offer-repository";
import { conversationRepository } from "@/lib/db/community/conversation-repository";
import type {
  HelperRequestOffer,
  HelperRequestDetail,
} from "@/lib/types/community";
import type { ConversationSummary } from "@/lib/types/community/conversations";
import type { CaseEventRow } from "@/lib/db/community/types";

export interface CreateOfferBody {
  offer_message: string;
  availability?: string;
  skill_tags?: string[];
  technician_profile_id?: string;
}

export interface CreateOfferResult {
  offer: HelperRequestOffer;
  helper_request_status: string;
}

export function createOffer(
  requestId: string,
  helperUserId: string,
  body: CreateOfferBody
): CreateOfferResult {
  const request = helperRequestRepository.findById(requestId);
  if (!request) throw Object.assign(new Error("not found"), { status: 404 });
  if (request.user_id === helperUserId)
    throw Object.assign(new Error("owner cannot offer on own request"), {
      status: 403,
    });

  const existing = helperOfferRepository.findByHelper(helperUserId, requestId);
  if (existing && existing.status === "pending") {
    return { offer: existing, helper_request_status: request.status };
  }

  const offer = helperOfferRepository.create({
    helper_request_id: requestId,
    helper_user_id: helperUserId,
    technician_profile_id: body.technician_profile_id ?? null,
    offer_message: body.offer_message,
    availability: body.availability ?? null,
    skill_tags: body.skill_tags ?? [],
  });

  const updatedRequest = helperRequestRepository.update(requestId, {
    status: "helper_offered",
  });

  emitOfferEvent(request.case_id, "offer_created", requestId, offer.id);

  return { offer, helper_request_status: updatedRequest.status };
}

export interface RespondResult {
  offer: HelperRequestOffer;
  helper_request: HelperRequestDetail;
  conversation?: ConversationSummary;
}

export function respondToOffer(
  requestId: string,
  offerId: string,
  actorUserId: string,
  action: "accept" | "decline" | "withdraw"
): RespondResult {
  const request = helperRequestRepository.findById(requestId);
  if (!request) throw Object.assign(new Error("not found"), { status: 404 });

  const offer = helperOfferRepository.findById(offerId);
  if (!offer || offer.helper_request_id !== requestId)
    throw Object.assign(new Error("offer not found"), { status: 404 });

  if (action === "withdraw") {
    if (offer.helper_user_id !== actorUserId)
      throw Object.assign(new Error("only the offer author can withdraw"), {
        status: 403,
      });
    const updated = helperOfferRepository.updateStatus(offerId, "withdrawn");
    const updatedRequest = helperRequestRepository.findById(requestId)!;
    emitOfferEvent(request.case_id, "offer_withdrawn", requestId, offerId);
    return { offer: updated, helper_request: updatedRequest };
  }

  if (request.user_id !== actorUserId)
    throw Object.assign(new Error("only the request owner can accept/decline"), {
      status: 403,
    });

  if (action === "decline") {
    const updated = helperOfferRepository.updateStatus(offerId, "declined");
    const updatedRequest = helperRequestRepository.findById(requestId)!;
    emitOfferEvent(request.case_id, "offer_declined", requestId, offerId);
    return { offer: updated, helper_request: updatedRequest };
  }

  // accept
  const updatedOffer = helperOfferRepository.updateStatus(offerId, "accepted");
  helperOfferRepository.declineCompeting(requestId, offerId);

  const updatedRequest = helperRequestRepository.update(requestId, {
    status: "helper_accepted",
    accepted_offer_id: offerId,
  });

  const conversation = conversationRepository.upsertForOffer({
    caseId: request.case_id,
    helperRequestId: requestId,
    offerId,
  });

  conversationRepository.ensureParticipant(conversation.id, request.user_id);
  conversationRepository.ensureParticipant(
    conversation.id,
    offer.helper_user_id
  );

  emitOfferEvent(request.case_id, "offer_accepted", requestId, offerId);

  return { offer: updatedOffer, helper_request: updatedRequest, conversation };
}

export function emitOfferEvent(
  caseId: string,
  kind: string,
  requestId: string,
  offerId: string
): void {
  const row: CaseEventRow = {
    id: randomUUID(),
    case_id: caseId,
    run_id: null,
    phase: "communal_repair",
    status: kind,
    payload: { helper_request_id: requestId, offer_id: offerId },
    created_at: new Date().toISOString(),
  };
  store.case_events.set(row.id, row);
}
