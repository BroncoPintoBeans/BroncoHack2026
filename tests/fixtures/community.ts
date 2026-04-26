import type {
  HelperRequest,
  HelperRequestDetail,
  HelperRequestOffer,
  DiagnosisSnapshot,
  VerdictSnapshot,
  ActionPlanSnapshot,
} from "@/lib/types/community/helper-requests";
import type { ConversationSummary, Message } from "@/lib/types/community/conversations";

// ── Deterministic IDs ──────────────────────────────────────────────────────

export const OWNER_USER_ID = "00000000-0000-4000-8000-000000000001";
export const HELPER_USER_ID = "00000000-0000-4000-8000-000000000002";
export const SECOND_HELPER_USER_ID = "00000000-0000-4000-8000-000000000003";
export const CASE_ID = "84920000-0000-4000-8000-000000000001";
export const RUN_ID = "84920000-0000-4000-8000-000000000101";
export const HELPER_REQUEST_ID = "84920000-0000-4000-8000-000000000201";
export const OFFER_ID = "84920000-0000-4000-8000-000000000301";
export const CONVERSATION_ID = "84920000-0000-4000-8000-000000000401";

// ── Case ───────────────────────────────────────────────────────────────────

export const fixtureCasePublicSummary = {
  id: CASE_ID,
  category: "laptop",
  title: "MacBook Pro display dims on hinge open — Flexgate",
  symptoms: "Screen backlight fades to black when lid opened past 40 degrees",
  urgency: "urgent",
};

// ── Case Run ───────────────────────────────────────────────────────────────

export const fixtureCaseRun = {
  id: RUN_ID,
  case_id: CASE_ID,
  created_at: "2025-03-01T10:00:00.000Z",
  updated_at: "2025-03-01T10:05:00.000Z",
};

// ── Snapshots ──────────────────────────────────────────────────────────────

export const fixtureDiagnosis: DiagnosisSnapshot = {
  top_causes: [
    { cause: "Flexgate display cable failure", likelihood: 0.87 },
    { cause: "LCD backlight inverter failure", likelihood: 0.08 },
    { cause: "GPU driver issue", likelihood: 0.05 },
  ],
  confidence: 0.87,
  missing_evidence: ["Serial number age confirmation"],
  safety_flags: [],
  technician_questions: [
    "Does the display dim or flicker only after the lid passes a certain angle?",
    "Has the laptop had any recent drops, liquid exposure, or display repairs?",
  ],
};

export const fixtureVerdict: VerdictSnapshot = {
  rrr_score: 2.1,
  rrr_breakdown: {
    repairability: 7,
    risk: 3,
    resource_cost: 2,
  },
  label: "Repair",
  rationale: "Cable replacement ~$15, well-documented iFixit guide available",
  uncertainty_note: "Confidence high given symptom pattern match",
  repair_cost_band: "$10-$30",
  replacement_cost_band: "$800-$1200",
};

export const fixtureActionPlan: ActionPlanSnapshot = {
  steps: [
    { order: 1, description: "Power off and remove battery" },
    { order: 2, description: "Remove display assembly screws" },
    { order: 3, description: "Disconnect and replace display cable" },
    { order: 4, description: "Reassemble and test" },
  ],
  technician_questions: [
    "Is the dimming consistent at all angles past 40 degrees?",
    "Has the machine been dropped or had liquid contact?",
  ],
  helper_request_template:
    "I need help replacing the display cable on my MacBook Pro. The screen dims when the lid is opened past ~40 degrees, which is a classic Flexgate symptom. iFixit guide is available. Parts cost ~$15.",
  safety_preamble:
    "Discharge static before handling internal components. Disconnect battery before proceeding.",
};

// ── Helper Request: Open (no offers yet) ──────────────────────────────────

export const fixtureHelperRequestOpen: HelperRequestDetail = {
  id: HELPER_REQUEST_ID,
  case_id: CASE_ID,
  run_id: RUN_ID,
  user_id: OWNER_USER_ID,
  title: "Need help replacing MacBook Pro display cable (Flexgate)",
  public_summary:
    "My MacBook Pro screen fades to black when opened past 40 degrees. This is a known Flexgate issue. Looking for someone with iFixit experience to help replace the cable.",
  helper_request_template: fixtureActionPlan.helper_request_template ?? null,
  category: "laptop",
  urgency: "urgent",
  campus_area: "Engineering Building",
  preferred_time: "Weekday evenings or weekends",
  skill_tags: ["macbook-repair", "ifixit", "display-cable"],
  safety_flags: [],
  status: "open",
  diagnosis_snapshot: fixtureDiagnosis as Record<string, unknown>,
  verdict_snapshot: fixtureVerdict as Record<string, unknown>,
  action_plan_snapshot: fixtureActionPlan as Record<string, unknown>,
  accepted_offer_id: null,
  expires_at: "2025-04-01T00:00:00.000Z",
  created_at: "2025-03-01T10:10:00.000Z",
  updated_at: "2025-03-01T10:10:00.000Z",
  pending_offer_count: 0,
};

// ── Helper Request Offer: Pending ─────────────────────────────────────────

export const fixtureOfferPending: HelperRequestOffer = {
  id: OFFER_ID,
  helper_request_id: HELPER_REQUEST_ID,
  helper_user_id: HELPER_USER_ID,
  technician_profile_id: null,
  offer_message:
    "I've replaced display cables on several MacBook Pros. I have a spudger set and can meet you on campus this weekend.",
  availability: "Saturday or Sunday afternoon",
  skill_tags: ["macbook-repair", "display-cable"],
  status: "pending",
  created_at: "2025-03-02T14:00:00.000Z",
  updated_at: "2025-03-02T14:00:00.000Z",
};

// ── Accepted State ─────────────────────────────────────────────────────────

export const fixtureHelperRequestAccepted: HelperRequestDetail = {
  ...fixtureHelperRequestOpen,
  status: "helper_accepted",
  accepted_offer_id: OFFER_ID,
  pending_offer_count: 0,
  updated_at: "2025-03-02T15:00:00.000Z",
};

export const fixtureOfferAccepted: HelperRequestOffer = {
  ...fixtureOfferPending,
  status: "accepted",
  updated_at: "2025-03-02T15:00:00.000Z",
};

export const fixtureConversation: ConversationSummary = {
  id: CONVERSATION_ID,
  case_id: CASE_ID,
  helper_request_id: HELPER_REQUEST_ID,
  helper_request_offer_id: OFFER_ID,
  conversation_type: "case_helper",
  participant_ids: [OWNER_USER_ID, HELPER_USER_ID],
  last_message_at: "2025-03-02T15:05:00.000Z",
  message_count: 2,
  created_at: "2025-03-02T15:00:00.000Z",
  updated_at: "2025-03-02T15:05:00.000Z",
};

export const fixtureMessages: Message[] = [
  {
    id: "84920000-0000-4000-8000-000000000501",
    conversation_id: CONVERSATION_ID,
    sender_user_id: OWNER_USER_ID,
    body: "Thanks for offering to help! Can we meet Saturday at 2pm near the Engineering Building?",
    client_id: null,
    created_at: "2025-03-02T15:01:00.000Z",
  },
  {
    id: "84920000-0000-4000-8000-000000000502",
    conversation_id: CONVERSATION_ID,
    sender_user_id: HELPER_USER_ID,
    body: "Saturday 2pm works great. I'll bring my toolkit. See you there!",
    client_id: null,
    created_at: "2025-03-02T15:05:00.000Z",
  },
];

// ── Terminal State: Resolved ───────────────────────────────────────────────

export const fixtureHelperRequestResolved: HelperRequest = {
  ...fixtureHelperRequestOpen,
  status: "resolved",
  accepted_offer_id: OFFER_ID,
  updated_at: "2025-03-09T16:00:00.000Z",
};
