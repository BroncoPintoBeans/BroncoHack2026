import { randomUUID } from "crypto";
import type { ConversationSummary, Message } from "@/lib/types/community/conversations";
import type { ConversationRow, ConversationParticipantRow, MessageRow } from "./types";
import { store } from "./store";

export interface ConversationRepository {
  findById(id: string): ConversationSummary | null;
  findByOfferPair(helperRequestOfferId: string): ConversationSummary | null;
  listForUser(
    userId: string,
    type?: string,
    limit?: number,
    cursor?: string
  ): { items: ConversationSummary[]; nextCursor: string | null };
  upsertForOffer(data: {
    caseId: string;
    helperRequestId: string;
    offerId: string;
  }): ConversationSummary;
  ensureParticipant(conversationId: string, userId: string): void;
  isParticipant(conversationId: string, userId: string): boolean;
  listMessages(
    conversationId: string,
    limit?: number,
    before?: string
  ): { messages: Message[]; nextCursor: string | null };
  addMessage(
    conversationId: string,
    senderId: string,
    body: string,
    clientId?: string
  ): Message;
}

function participantIdsFor(conversationId: string): string[] {
  const ids: string[] = [];
  for (const row of store.conversation_participants.values()) {
    if (row.conversation_id === conversationId) {
      ids.push(row.user_id);
    }
  }
  return ids;
}

function lastMessageAt(conversationId: string): string | null {
  let latest: string | null = null;
  for (const row of store.messages.values()) {
    if (row.conversation_id === conversationId) {
      if (!latest || row.created_at > latest) {
        latest = row.created_at;
      }
    }
  }
  return latest;
}

function messageCountFor(conversationId: string): number {
  let count = 0;
  for (const row of store.messages.values()) {
    if (row.conversation_id === conversationId) count++;
  }
  return count;
}

function rowToSummary(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    case_id: row.case_id,
    listing_id: row.listing_id ?? null,
    helper_request_id: row.helper_request_id,
    helper_request_offer_id: row.helper_request_offer_id,
    conversation_type: row.conversation_type,
    participant_ids: participantIdsFor(row.id),
    last_message_at: lastMessageAt(row.id),
    message_count: messageCountFor(row.id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function rowToMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_user_id: row.sender_user_id,
    body: row.body,
    client_id: row.client_id,
    created_at: row.created_at,
  };
}

export const conversationRepository: ConversationRepository = {
  findById(id) {
    const row = store.conversations.get(id);
    return row ? rowToSummary(row) : null;
  },

  findByOfferPair(helperRequestOfferId) {
    for (const row of store.conversations.values()) {
      if (row.helper_request_offer_id === helperRequestOfferId) {
        return rowToSummary(row);
      }
    }
    return null;
  },

  listForUser(userId, type, limit = 20, cursor) {
    const participatingIds = new Set<string>();
    for (const row of store.conversation_participants.values()) {
      if (row.user_id === userId) {
        participatingIds.add(row.conversation_id);
      }
    }

    let rows = Array.from(store.conversations.values()).filter((r) =>
      participatingIds.has(r.id)
    );

    if (type) {
      rows = rows.filter((r) => r.conversation_type === type);
    }

    rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    if (cursor) {
      const idx = rows.findIndex((r) => r.updated_at === cursor);
      if (idx !== -1) rows = rows.slice(idx + 1);
    }

    const page = rows.slice(0, limit);
    const nextCursor =
      page.length === limit && rows.length > limit
        ? page[page.length - 1].updated_at
        : null;

    return { items: page.map(rowToSummary), nextCursor };
  },

  upsertForOffer({ caseId, helperRequestId, offerId }) {
    // Return existing if one is already linked to this offer
    for (const row of store.conversations.values()) {
      if (row.helper_request_offer_id === offerId) {
        return rowToSummary(row);
      }
    }
    const now = new Date().toISOString();
    const row: ConversationRow = {
      id: randomUUID(),
      case_id: caseId,
      helper_request_id: helperRequestId,
      helper_request_offer_id: offerId,
      conversation_type: "case_helper",
      created_at: now,
      updated_at: now,
    };
    store.conversations.set(row.id, row);
    return rowToSummary(row);
  },

  ensureParticipant(conversationId, userId) {
    for (const row of store.conversation_participants.values()) {
      if (row.conversation_id === conversationId && row.user_id === userId) {
        return;
      }
    }
    const participantRow: ConversationParticipantRow = {
      id: randomUUID(),
      conversation_id: conversationId,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    store.conversation_participants.set(participantRow.id, participantRow);
  },

  isParticipant(conversationId, userId) {
    for (const row of store.conversation_participants.values()) {
      if (row.conversation_id === conversationId && row.user_id === userId) {
        return true;
      }
    }
    return false;
  },

  listMessages(conversationId, limit = 50, before) {
    let messages = Array.from(store.messages.values()).filter(
      (r) => r.conversation_id === conversationId
    );

    messages.sort((a, b) => a.created_at.localeCompare(b.created_at));

    if (before) {
      const idx = messages.findIndex((r) => r.created_at >= before);
      if (idx !== -1) messages = messages.slice(0, idx);
    }

    // Take last `limit` messages (most recent)
    const page = messages.slice(-limit);
    const nextCursor =
      messages.length > limit && page.length > 0 ? page[0].created_at : null;

    return { messages: page.map(rowToMessage), nextCursor };
  },

  addMessage(conversationId, senderId, body, clientId) {
    const now = new Date().toISOString();
    const row: MessageRow = {
      id: randomUUID(),
      conversation_id: conversationId,
      sender_user_id: senderId,
      body,
      client_id: clientId ?? null,
      created_at: now,
    };
    store.messages.set(row.id, row);

    // Update conversation updated_at
    const conv = store.conversations.get(conversationId);
    if (conv) {
      store.conversations.set(conversationId, { ...conv, updated_at: now });
    }

    return rowToMessage(row);
  },
};
