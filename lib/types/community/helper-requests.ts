export const helperRequestStatusValues = [
  "draft",
  "open",
  "helper_offered",
  "helper_accepted",
  "in_progress",
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
] as const;

export type HelperRequestStatus = (typeof helperRequestStatusValues)[number];

export const helperOfferStatusValues = [
  "pending",
  "accepted",
  "declined",
  "withdrawn",
] as const;

export type HelperOfferStatus = (typeof helperOfferStatusValues)[number];

export interface HelperRequest {
  id: string;
  case_id: string;
  run_id: string | null;
  report_id: string | null;
  user_id: string;
  title: string;
  public_summary: string;
  helper_request_template: string | null;
  category: string;
  urgency: string;
  campus_area: string | null;
  preferred_time: string | null;
  skill_tags: string[];
  safety_flags: string[];
  status: HelperRequestStatus;
  diagnosis_snapshot: Record<string, unknown>;
  verdict_snapshot: Record<string, unknown>;
  action_plan_snapshot: Record<string, unknown>;
  accepted_offer_id: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HelperRequestCard {
  id: string;
  case_id: string;
  report_id: string | null;
  title: string;
  public_summary: string;
  category: string;
  urgency: string;
  campus_area: string | null;
  preferred_time: string | null;
  skill_tags: string[];
  safety_flags: string[];
  status: HelperRequestStatus;
  verdict_label: string | null;
  rrr_score: number | null;
  pending_offer_count: number;
  created_at: string;
  updated_at: string;
}

export interface HelperRequestDetail extends HelperRequest {
  pending_offer_count: number;
}

export interface HelperRequestOffer {
  id: string;
  helper_request_id: string;
  helper_user_id: string;
  technician_profile_id: string | null;
  offer_message: string;
  availability: string | null;
  skill_tags: string[];
  status: HelperOfferStatus;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisSnapshot {
  top_causes?: unknown[];
  confidence?: number;
  missing_evidence?: string[];
  safety_flags?: string[];
  technician_questions?: string[];
}

export interface VerdictSnapshot {
  rrr_score?: number;
  rrr_breakdown?: Record<string, unknown>;
  label?: string;
  rationale?: string;
  uncertainty_note?: string;
  repair_cost_band?: string;
  replacement_cost_band?: string;
}

export interface ActionPlanSnapshot {
  steps?: unknown[];
  technician_questions?: string[];
  helper_request_template?: string;
  safety_preamble?: string;
}

export interface CasePublicSummary {
  id: string;
  category: string;
  title: string;
  symptoms: string | null;
  urgency: string;
}

export interface HelperRequestPermissions {
  is_owner: boolean;
  can_offer: boolean;
  can_message: boolean;
  can_close: boolean;
}
