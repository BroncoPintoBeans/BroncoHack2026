/**
 * Populates the in-memory store with deterministic Communal Repair fixtures.
 * Call seedCommunityDemo() before running demo/dev API routes.
 * Uses IDs from tests/fixtures/community.ts.
 */

import { resetStore, store } from "@/lib/db/community/store";
import type {
  CaseRow,
  CaseRunRow,
  DiagnosisRow,
  VerdictRow,
  ActionPlanRow,
  HelperRequestRow,
  HelperRequestOfferRow,
  ConversationRow,
  ConversationParticipantRow,
  MessageRow,
} from "@/lib/db/community/types";
import {
  OWNER_USER_ID,
  HELPER_USER_ID,
  SECOND_HELPER_USER_ID,
  CASE_ID,
  RUN_ID,
  HELPER_REQUEST_ID,
  OFFER_ID,
  CONVERSATION_ID,
} from "@/tests/fixtures/community";

// Additional IDs for resolved scenario
const RESOLVED_CASE_ID = "84920000-0000-4000-8000-000000000002";
const RESOLVED_RUN_ID = "84920000-0000-4000-8000-000000000102";
const RESOLVED_REQUEST_ID = "84920000-0000-4000-8000-000000000202";
const RESOLVED_OFFER_ID = "84920000-0000-4000-8000-000000000302";
const SECOND_OFFER_ID = "84920000-0000-4000-8000-000000000303";
const MSG_1_ID = "84920000-0000-4000-8000-000000000501";
const MSG_2_ID = "84920000-0000-4000-8000-000000000502";
const PARTICIPANT_OWNER_ID = "84920000-0000-4000-8000-000000000601";
const PARTICIPANT_HELPER_ID = "84920000-0000-4000-8000-000000000602";

export function seedCommunityDemo(): void {
  resetStore();

  // ── 1. MacBook Flexgate case ────────────────────────────────────────────────
  const mainCase: CaseRow = {
    id: CASE_ID,
    user_id: OWNER_USER_ID,
    category: "laptop",
    title: "MacBook Pro display dims on hinge open — Flexgate",
    symptoms: "Screen backlight fades to black when lid opened past 40 degrees",
    urgency: "urgent",
    created_at: "2025-03-01T09:00:00.000Z",
    updated_at: "2025-03-01T09:00:00.000Z",
  };
  store.cases.set(CASE_ID, mainCase);

  // ── 2. Case run ─────────────────────────────────────────────────────────────
  const mainRun: CaseRunRow = {
    id: RUN_ID,
    case_id: CASE_ID,
    created_at: "2025-03-01T10:00:00.000Z",
    updated_at: "2025-03-01T10:05:00.000Z",
  };
  store.case_runs.set(RUN_ID, mainRun);

  // ── 3. Diagnosis snapshot ───────────────────────────────────────────────────
  const diagnosisRow: DiagnosisRow = {
    id: "84920000-0000-4000-8000-000000000701",
    case_id: CASE_ID,
    run_id: RUN_ID,
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
    created_at: "2025-03-01T10:02:00.000Z",
  };
  store.diagnoses.set(diagnosisRow.id, diagnosisRow);

  // ── 4. Verdict snapshot ─────────────────────────────────────────────────────
  const verdictRow: VerdictRow = {
    id: "84920000-0000-4000-8000-000000000801",
    case_id: CASE_ID,
    run_id: RUN_ID,
    rrr_score: 2.1,
    rrr_breakdown: { repairability: 7, risk: 3, resource_cost: 2 },
    label: "Repair",
    rationale: "Cable replacement ~$15, well-documented iFixit guide available",
    uncertainty_note: "Confidence high given symptom pattern match",
    repair_cost_band: "$10-$30",
    replacement_cost_band: "$800-$1200",
    created_at: "2025-03-01T10:03:00.000Z",
  };
  store.verdicts.set(verdictRow.id, verdictRow);

  // ── 5. Action plan snapshot ─────────────────────────────────────────────────
  const actionPlanRow: ActionPlanRow = {
    id: "84920000-0000-4000-8000-000000000901",
    case_id: CASE_ID,
    run_id: RUN_ID,
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
      "I need help replacing the display cable on my MacBook Pro 2016-2019. The screen has stage light bleeding at the bottom. Tools needed: spudger, pentalobe screwdriver.",
    safety_preamble:
      "Discharge static before handling internal components. Disconnect battery before proceeding.",
    created_at: "2025-03-01T10:04:00.000Z",
  };
  store.action_plans.set(actionPlanRow.id, actionPlanRow);

  // ── 6. Open helper request for the smoke flow ───────────────────────────────
  const openRequest: HelperRequestRow = {
    id: HELPER_REQUEST_ID,
    case_id: CASE_ID,
    run_id: RUN_ID,
    user_id: OWNER_USER_ID,
    title: "Need help replacing MacBook Pro display cable (Flexgate)",
    public_summary:
      "My MacBook Pro screen fades to black when opened past 40 degrees. This is a known Flexgate issue. Looking for someone with iFixit experience to help replace the cable.",
    helper_request_template:
      "I need help replacing the display cable on my MacBook Pro. The screen dims when the lid is opened past ~40 degrees, which is a classic Flexgate symptom. iFixit guide is available. Parts cost ~$15.",
    category: "laptop",
    urgency: "urgent",
    campus_area: "Engineering Building",
    preferred_time: "Weekday evenings or weekends",
    skill_tags: ["macbook-repair", "ifixit", "display-cable"],
    safety_flags: [],
    status: "open",
    diagnosis_snapshot: {
      top_causes: diagnosisRow.top_causes,
      confidence: diagnosisRow.confidence,
      missing_evidence: diagnosisRow.missing_evidence,
      safety_flags: diagnosisRow.safety_flags,
      technician_questions: diagnosisRow.technician_questions,
    },
    verdict_snapshot: {
      rrr_score: verdictRow.rrr_score,
      rrr_breakdown: verdictRow.rrr_breakdown,
      label: verdictRow.label,
      rationale: verdictRow.rationale,
      uncertainty_note: verdictRow.uncertainty_note,
      repair_cost_band: verdictRow.repair_cost_band,
      replacement_cost_band: verdictRow.replacement_cost_band,
    },
    action_plan_snapshot: {
      steps: actionPlanRow.steps,
      technician_questions: actionPlanRow.technician_questions,
      helper_request_template: actionPlanRow.helper_request_template,
      safety_preamble: actionPlanRow.safety_preamble,
    },
    accepted_offer_id: null,
    expires_at: "2025-04-01T00:00:00.000Z",
    created_at: "2025-03-01T10:10:00.000Z",
    updated_at: "2025-03-01T10:10:00.000Z",
  };
  store.helper_requests.set(HELPER_REQUEST_ID, openRequest);

  // ── 7. Pending offer from helper ────────────────────────────────────────────
  // Second helper also submitted (will be declined)
  const secondOffer: HelperRequestOfferRow = {
    id: SECOND_OFFER_ID,
    helper_request_id: HELPER_REQUEST_ID,
    helper_user_id: SECOND_HELPER_USER_ID,
    technician_profile_id: null,
    offer_message: "I can help with MacBook repair, I have the needed tools.",
    availability: "Sunday morning",
    skill_tags: ["macbook-repair"],
    status: "declined",
    created_at: "2025-03-02T13:00:00.000Z",
    updated_at: "2025-03-02T15:00:00.000Z",
  };
  store.helper_request_offers.set(SECOND_OFFER_ID, secondOffer);

  // ── 8. Fixed pending offer used by the smoke flow ───────────────────────────
  const pendingOffer: HelperRequestOfferRow = {
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
  store.helper_request_offers.set(OFFER_ID, pendingOffer);

  // ── 9. Preallocated conversation with two messages ──────────────────────────
  const conversation: ConversationRow = {
    id: CONVERSATION_ID,
    case_id: CASE_ID,
    helper_request_id: HELPER_REQUEST_ID,
    helper_request_offer_id: OFFER_ID,
    conversation_type: "case_helper",
    created_at: "2025-03-02T15:00:00.000Z",
    updated_at: "2025-03-02T15:05:00.000Z",
  };
  store.conversations.set(CONVERSATION_ID, conversation);

  const ownerParticipant: ConversationParticipantRow = {
    id: PARTICIPANT_OWNER_ID,
    conversation_id: CONVERSATION_ID,
    user_id: OWNER_USER_ID,
    created_at: "2025-03-02T15:00:00.000Z",
  };
  store.conversation_participants.set(PARTICIPANT_OWNER_ID, ownerParticipant);

  const helperParticipant: ConversationParticipantRow = {
    id: PARTICIPANT_HELPER_ID,
    conversation_id: CONVERSATION_ID,
    user_id: HELPER_USER_ID,
    created_at: "2025-03-02T15:00:00.000Z",
  };
  store.conversation_participants.set(PARTICIPANT_HELPER_ID, helperParticipant);

  const msg1: MessageRow = {
    id: MSG_1_ID,
    conversation_id: CONVERSATION_ID,
    sender_user_id: OWNER_USER_ID,
    body: "Thanks for offering to help! Can we meet Saturday at 2pm near the Engineering Building?",
    client_id: null,
    created_at: "2025-03-02T15:01:00.000Z",
  };
  store.messages.set(MSG_1_ID, msg1);

  const msg2: MessageRow = {
    id: MSG_2_ID,
    conversation_id: CONVERSATION_ID,
    sender_user_id: HELPER_USER_ID,
    body: "Saturday 2pm works great. I'll bring my toolkit. See you there!",
    client_id: null,
    created_at: "2025-03-02T15:05:00.000Z",
  };
  store.messages.set(MSG_2_ID, msg2);

  // ── 10. Resolved scenario (for smoke testing terminal state) ─────────────────
  const resolvedCase: CaseRow = {
    id: RESOLVED_CASE_ID,
    user_id: OWNER_USER_ID,
    category: "laptop",
    title: "Keyboard replacement — resolved",
    symptoms: "Several keys stopped responding after liquid spill",
    urgency: "normal",
    created_at: "2025-02-01T09:00:00.000Z",
    updated_at: "2025-02-10T09:00:00.000Z",
  };
  store.cases.set(RESOLVED_CASE_ID, resolvedCase);

  const resolvedRun: CaseRunRow = {
    id: RESOLVED_RUN_ID,
    case_id: RESOLVED_CASE_ID,
    created_at: "2025-02-01T10:00:00.000Z",
    updated_at: "2025-02-01T10:05:00.000Z",
  };
  store.case_runs.set(RESOLVED_RUN_ID, resolvedRun);

  const resolvedRequest: HelperRequestRow = {
    id: RESOLVED_REQUEST_ID,
    case_id: RESOLVED_CASE_ID,
    run_id: RESOLVED_RUN_ID,
    user_id: OWNER_USER_ID,
    title: "Keyboard replacement for MacBook Air — resolved",
    public_summary: "Needed help replacing keyboard after liquid spill. Issue resolved.",
    helper_request_template: null,
    category: "laptop",
    urgency: "normal",
    campus_area: "Library",
    preferred_time: null,
    skill_tags: ["macbook-repair"],
    safety_flags: [],
    status: "resolved",
    diagnosis_snapshot: {},
    verdict_snapshot: { rrr_score: 3.5, label: "Repair" },
    action_plan_snapshot: {},
    accepted_offer_id: RESOLVED_OFFER_ID,
    expires_at: null,
    created_at: "2025-02-01T10:10:00.000Z",
    updated_at: "2025-02-10T09:00:00.000Z",
  };
  store.helper_requests.set(RESOLVED_REQUEST_ID, resolvedRequest);

  const resolvedOffer: HelperRequestOfferRow = {
    id: RESOLVED_OFFER_ID,
    helper_request_id: RESOLVED_REQUEST_ID,
    helper_user_id: HELPER_USER_ID,
    technician_profile_id: null,
    offer_message: "I can help with keyboard replacement, done it before.",
    availability: "Weekday afternoon",
    skill_tags: ["macbook-repair"],
    status: "accepted",
    created_at: "2025-02-02T10:00:00.000Z",
    updated_at: "2025-02-10T09:00:00.000Z",
  };
  store.helper_request_offers.set(RESOLVED_OFFER_ID, resolvedOffer);
}
