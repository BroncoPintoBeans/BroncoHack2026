import { randomUUID } from "crypto";
import type { HelperRequestOffer, HelperOfferStatus } from "@/lib/types/community/helper-requests";
import type { HelperRequestOfferRow } from "./types";
import { store } from "./store";

export interface CreateOfferData {
  id?: string;
  helper_request_id: string;
  helper_user_id: string;
  technician_profile_id?: string | null;
  offer_message: string;
  availability?: string | null;
  skill_tags?: string[];
}

export interface HelperOfferRepository {
  findById(id: string): HelperRequestOffer | null;
  findByRequest(requestId: string): HelperRequestOffer[];
  findByHelper(helperUserId: string, requestId: string): HelperRequestOffer | null;
  create(data: CreateOfferData): HelperRequestOffer;
  updateStatus(id: string, status: HelperOfferStatus): HelperRequestOffer;
  declineCompeting(requestId: string, exceptOfferId: string): void;
}

function rowToOffer(row: HelperRequestOfferRow): HelperRequestOffer {
  return {
    id: row.id,
    helper_request_id: row.helper_request_id,
    helper_user_id: row.helper_user_id,
    technician_profile_id: row.technician_profile_id,
    offer_message: row.offer_message,
    availability: row.availability,
    skill_tags: row.skill_tags,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const helperOfferRepository: HelperOfferRepository = {
  findById(id) {
    const row = store.helper_request_offers.get(id);
    return row ? rowToOffer(row) : null;
  },

  findByRequest(requestId) {
    const offers: HelperRequestOffer[] = [];
    for (const row of store.helper_request_offers.values()) {
      if (row.helper_request_id === requestId) {
        offers.push(rowToOffer(row));
      }
    }
    offers.sort((a, b) => b.created_at.localeCompare(a.created_at));
    return offers;
  },

  findByHelper(helperUserId, requestId) {
    for (const row of store.helper_request_offers.values()) {
      if (row.helper_user_id === helperUserId && row.helper_request_id === requestId) {
        return rowToOffer(row);
      }
    }
    return null;
  },

  create(data) {
    const now = new Date().toISOString();
    const row: HelperRequestOfferRow = {
      id: data.id ?? randomUUID(),
      helper_request_id: data.helper_request_id,
      helper_user_id: data.helper_user_id,
      technician_profile_id: data.technician_profile_id ?? null,
      offer_message: data.offer_message,
      availability: data.availability ?? null,
      skill_tags: data.skill_tags ?? [],
      status: "pending",
      created_at: now,
      updated_at: now,
    };
    store.helper_request_offers.set(row.id, row);
    return rowToOffer(row);
  },

  updateStatus(id, status) {
    const existing = store.helper_request_offers.get(id);
    if (!existing) throw new Error(`helper_request_offer ${id} not found`);
    const updated: HelperRequestOfferRow = {
      ...existing,
      status,
      updated_at: new Date().toISOString(),
    };
    store.helper_request_offers.set(id, updated);
    return rowToOffer(updated);
  },

  declineCompeting(requestId, exceptOfferId) {
    for (const [id, row] of store.helper_request_offers.entries()) {
      if (
        row.helper_request_id === requestId &&
        row.id !== exceptOfferId &&
        row.status === "pending"
      ) {
        store.helper_request_offers.set(id, {
          ...row,
          status: "declined",
          updated_at: new Date().toISOString(),
        });
      }
    }
  },
};
