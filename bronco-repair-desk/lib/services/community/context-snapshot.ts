import { store } from "@/lib/db/community/store";
import type {
  DiagnosisSnapshot,
  VerdictSnapshot,
  ActionPlanSnapshot,
} from "@/lib/types/community";

interface ContextSnapshot {
  diagnosisSnapshot: DiagnosisSnapshot;
  verdictSnapshot: VerdictSnapshot;
  actionPlanSnapshot: ActionPlanSnapshot;
}

export function buildContextSnapshot(
  caseId: string,
  runId: string | null
): ContextSnapshot {
  let diagnosisSnapshot: DiagnosisSnapshot = {};
  let verdictSnapshot: VerdictSnapshot = {};
  let actionPlanSnapshot: ActionPlanSnapshot = {};

  for (const row of store.diagnoses.values()) {
    if (row.case_id === caseId && (runId === null || row.run_id === runId)) {
      diagnosisSnapshot = {
        top_causes: row.top_causes,
        confidence: row.confidence,
        missing_evidence: row.missing_evidence,
        safety_flags: row.safety_flags,
      };
      break;
    }
  }

  for (const row of store.verdicts.values()) {
    if (row.case_id === caseId && (runId === null || row.run_id === runId)) {
      verdictSnapshot = {
        rrr_score: row.rrr_score,
        rrr_breakdown: row.rrr_breakdown,
        label: row.label,
        rationale: row.rationale,
        uncertainty_note: row.uncertainty_note ?? undefined,
        repair_cost_band: row.repair_cost_band ?? undefined,
        replacement_cost_band: row.replacement_cost_band ?? undefined,
      };
      break;
    }
  }

  for (const row of store.action_plans.values()) {
    if (row.case_id === caseId && (runId === null || row.run_id === runId)) {
      actionPlanSnapshot = {
        steps: row.steps,
        technician_questions: row.technician_questions,
        helper_request_template: row.helper_request_template ?? undefined,
        safety_preamble: row.safety_preamble ?? undefined,
      };
      break;
    }
  }

  return { diagnosisSnapshot, verdictSnapshot, actionPlanSnapshot };
}
