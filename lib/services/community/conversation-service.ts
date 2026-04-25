// Stub — will be replaced by the Messaging lane implementation.
import { conversationRepository } from "@/lib/db/community/conversation-repository";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { helperOfferRepository } from "@/lib/db/community/helper-offer-repository";
import type { ConversationSummary } from "@/lib/types/community/conversations";

export function createOrResumeConversation(
  helperRequestId: string,
  offerId: string,
  ownerId: string,
  initialMessage?: string
): ConversationSummary {
  const request = helperRequestRepository.findById(helperRequestId);
  if (!request) throw Object.assign(new Error("not found"), { status: 404 });

  const offer = helperOfferRepository.findById(offerId);
  if (!offer || offer.helper_request_id !== helperRequestId)
    throw Object.assign(new Error("offer not found"), { status: 404 });

  const conversation = conversationRepository.upsertForOffer({
    caseId: request.case_id,
    helperRequestId,
    offerId,
  });

  conversationRepository.ensureParticipant(conversation.id, ownerId);
  conversationRepository.ensureParticipant(conversation.id, offer.helper_user_id);

  if (initialMessage) {
    conversationRepository.addMessage(conversation.id, ownerId, initialMessage);
  }

  return conversationRepository.findById(conversation.id) ?? conversation;
}
