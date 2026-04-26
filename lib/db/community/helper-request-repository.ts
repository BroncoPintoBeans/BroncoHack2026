import { randomUUID } from "crypto";
import type {
  HelperRequestDetail,
  HelperRequestCard,
  HelperRequestStatus,
} from "@/lib/types/community/helper-requests";
import type { HelperRequestRow } from "./types";
import { store } from "./store";

export interface BoardFilters {
  status?: string;
  category?: string;
  urgency?: string;
  campus_area?: string;
  skill?: string;
  q?: string;
  mine?: "owner" | "helper";
  userId?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateHelperRequestData {
  id?: string;
  case_id: string;
  run_id: string | null;
  report_id: string;
  user_id: string;
  title: string;
  public_summary: string;
  helper_request_template?: string | null;
  category: string;
  urgency: string;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: string[];
  safety_flags?: string[];
  diagnosis_snapshot?: Record<string, unknown>;
  verdict_snapshot?: Record<string, unknown>;
  action_plan_snapshot?: Record<string, unknown>;
  expires_at?: string | null;
}

export interface UpdateHelperRequestData {
  title?: string;
  public_summary?: string;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: string[];
  status?: HelperRequestStatus;
  accepted_offer_id?: string | null;
}

export interface HelperRequestRepository {
  findById(id: string): HelperRequestDetail | null;
  findByCase(caseId: string): HelperRequestDetail | null;
  list(filters: BoardFilters): { items: HelperRequestCard[]; nextCursor: string | null };
  create(data: CreateHelperRequestData): HelperRequestDetail;
  update(id: string, data: UpdateHelperRequestData): HelperRequestDetail;
  countPendingOffers(requestId: string): number;
}

const TERMINAL_STATUSES: HelperRequestStatus[] = [
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
];

function countPendingOffersForRequest(requestId: string): number {
  let count = 0;
  for (const offer of store.helper_request_offers.values()) {
    if (offer.helper_request_id === requestId && offer.status === "pending") {
      count++;
    }
  }
  return count;
}

function rowToDetail(row: HelperRequestRow): HelperRequestDetail {
  return {
    id: row.id,
    case_id: row.case_id,
    run_id: row.run_id,
    report_id: row.report_id,
    user_id: row.user_id,
    title: row.title,
    public_summary: row.public_summary,
    helper_request_template: row.helper_request_template,
    category: row.category,
    urgency: row.urgency,
    campus_area: row.campus_area,
    preferred_time: row.preferred_time,
    skill_tags: row.skill_tags,
    safety_flags: row.safety_flags,
    status: row.status,
    diagnosis_snapshot: row.diagnosis_snapshot,
    verdict_snapshot: row.verdict_snapshot,
    action_plan_snapshot: row.action_plan_snapshot,
    accepted_offer_id: row.accepted_offer_id,
    expires_at: row.expires_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    pending_offer_count: countPendingOffersForRequest(row.id),
  };
}

function rowToCard(row: HelperRequestRow): HelperRequestCard {
  const verdictSnapshot = row.verdict_snapshot as Record<string, unknown>;
  return {
    id: row.id,
    case_id: row.case_id,
    report_id: row.report_id,
    title: row.title,
    public_summary: row.public_summary,
    category: row.category,
    urgency: row.urgency,
    campus_area: row.campus_area,
    preferred_time: row.preferred_time,
    skill_tags: row.skill_tags,
    safety_flags: row.safety_flags,
    status: row.status,
    verdict_label: typeof verdictSnapshot?.label === "string" ? verdictSnapshot.label : null,
    rrr_score: typeof verdictSnapshot?.rrr_score === "number" ? verdictSnapshot.rrr_score : null,
    pending_offer_count: countPendingOffersForRequest(row.id),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export const helperRequestRepository: HelperRequestRepository = {
  findById(id) {
    const row = store.helper_requests.get(id);
    return row ? rowToDetail(row) : null;
  },

  findByCase(caseId) {
    for (const row of store.helper_requests.values()) {
      if (row.case_id === caseId && !TERMINAL_STATUSES.includes(row.status)) {
        return rowToDetail(row);
      }
    }
    return null;
  },

  list(filters) {
    const limit = filters.limit ?? 20;
    let rows = Array.from(store.helper_requests.values());

    if (filters.status) {
      rows = rows.filter((r) => r.status === filters.status);
    }
    if (filters.category) {
      rows = rows.filter((r) => r.category === filters.category);
    }
    if (filters.urgency) {
      rows = rows.filter((r) => r.urgency === filters.urgency);
    }
    if (filters.campus_area) {
      rows = rows.filter((r) => r.campus_area === filters.campus_area);
    }
    if (filters.skill) {
      rows = rows.filter((r) => r.skill_tags.includes(filters.skill!));
    }
    if (filters.q) {
      const q = filters.q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.public_summary.toLowerCase().includes(q)
      );
    }
    if (filters.mine === "owner" && filters.userId) {
      rows = rows.filter((r) => r.user_id === filters.userId);
    }
    if (filters.mine === "helper" && filters.userId) {
      const helperRequestIds = new Set<string>();
      for (const offer of store.helper_request_offers.values()) {
        if (offer.helper_user_id === filters.userId) {
          helperRequestIds.add(offer.helper_request_id);
        }
      }
      rows = rows.filter((r) => helperRequestIds.has(r.id));
    }

    // Sort by created_at desc
    rows.sort((a, b) => b.created_at.localeCompare(a.created_at));

    // Cursor-based pagination: cursor is the created_at of the last item from prev page
    if (filters.cursor) {
      const idx = rows.findIndex((r) => r.created_at === filters.cursor);
      if (idx !== -1) {
        rows = rows.slice(idx + 1);
      }
    }

    const page = rows.slice(0, limit);
    const nextCursor = page.length === limit && rows.length > limit
      ? page[page.length - 1].created_at
      : null;

    return { items: page.map(rowToCard), nextCursor };
  },

  create(data) {
    const now = new Date().toISOString();
    const row: HelperRequestRow = {
      id: data.id ?? randomUUID(),
      case_id: data.case_id,
      run_id: data.run_id,
      report_id: data.report_id,
      user_id: data.user_id,
      title: data.title,
      public_summary: data.public_summary,
      helper_request_template: data.helper_request_template ?? null,
      category: data.category,
      urgency: data.urgency,
      campus_area: data.campus_area ?? null,
      preferred_time: data.preferred_time ?? null,
      skill_tags: data.skill_tags ?? [],
      safety_flags: data.safety_flags ?? [],
      status: "open",
      diagnosis_snapshot: data.diagnosis_snapshot ?? {},
      verdict_snapshot: data.verdict_snapshot ?? {},
      action_plan_snapshot: data.action_plan_snapshot ?? {},
      accepted_offer_id: null,
      expires_at: data.expires_at ?? null,
      created_at: now,
      updated_at: now,
    };
    store.helper_requests.set(row.id, row);
    return rowToDetail(row);
  },

  update(id, data) {
    const existing = store.helper_requests.get(id);
    if (!existing) throw new Error(`helper_request ${id} not found`);
    const updated: HelperRequestRow = {
      ...existing,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.public_summary !== undefined && { public_summary: data.public_summary }),
      ...(data.campus_area !== undefined && { campus_area: data.campus_area }),
      ...(data.preferred_time !== undefined && { preferred_time: data.preferred_time }),
      ...(data.skill_tags !== undefined && { skill_tags: data.skill_tags }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.accepted_offer_id !== undefined && { accepted_offer_id: data.accepted_offer_id }),
      updated_at: new Date().toISOString(),
    };
    store.helper_requests.set(id, updated);
    return rowToDetail(updated);
  },

  countPendingOffers(requestId) {
    return countPendingOffersForRequest(requestId);
  },
};
