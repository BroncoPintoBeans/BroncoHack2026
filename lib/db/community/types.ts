import type { HelperRequestStatus, HelperOfferStatus } from "@/lib/types/community/helper-requests";

// Row types match Supabase column shapes from the DB contract.

export interface CaseRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  symptoms: string | null;
  urgency: string;
  created_at: string;
  updated_at: string;
}

export interface CaseRunRow {
  id: string;
  case_id: string;
  created_at: string;
  updated_at: string;
}

export interface DiagnosisRow {
  id: string;
  case_id: string;
  run_id: string;
  top_causes: unknown[];
  confidence: number;
  missing_evidence: string[];
  safety_flags: string[];
  technician_questions: string[];
  created_at: string;
}

export interface VerdictRow {
  id: string;
  case_id: string;
  run_id: string;
  rrr_score: number;
  rrr_breakdown: Record<string, unknown>;
  label: string;
  rationale: string;
  uncertainty_note: string | null;
  repair_cost_band: string | null;
  replacement_cost_band: string | null;
  created_at: string;
}

export interface ActionPlanRow {
  id: string;
  case_id: string;
  run_id: string;
  steps: unknown[];
  technician_questions: string[];
  helper_request_template: string | null;
  safety_preamble: string | null;
  created_at: string;
}

export interface CaseEventRow {
  id: string;
  case_id: string;
  run_id: string | null;
  phase: string;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface HelperRoutingResultRow {
  run_id: string;
  case_id: string;
  user_id: string;
  matches: unknown[];
  created_at: string;
  updated_at: string;
}

export interface HelperRequestRow {
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

export interface HelperRequestOfferRow {
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

export interface ConversationRow {
  id: string;
  case_id: string | null;
  listing_id?: string | null;
  helper_request_id: string | null;
  helper_request_offer_id: string | null;
  conversation_type: "case_helper" | "listing";
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipantRow {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string;
  client_id: string | null;
  created_at: string;
}

export interface InMemoryStore {
  cases: Map<string, CaseRow>;
  case_runs: Map<string, CaseRunRow>;
  diagnoses: Map<string, DiagnosisRow>;
  verdicts: Map<string, VerdictRow>;
  action_plans: Map<string, ActionPlanRow>;
  case_events: Map<string, CaseEventRow>;
  helper_routing_results: Map<string, HelperRoutingResultRow>;
  helper_requests: Map<string, HelperRequestRow>;
  helper_request_offers: Map<string, HelperRequestOfferRow>;
  conversations: Map<string, ConversationRow>;
  conversation_participants: Map<string, ConversationParticipantRow>;
  messages: Map<string, MessageRow>;
}
