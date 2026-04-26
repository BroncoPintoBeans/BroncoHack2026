import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperRoutingPayload } from '../../types/payloads'

export async function writeDiagnosis(
  caseId: string,
  runId: string,
  payload: DiagnosisCompletePayload,
): Promise<void> {
  if (isSupabaseAvailable()) {
    const { error } = await getSupabaseClient()
      .from('diagnoses')
      .upsert({
        case_id: caseId,
        run_id: runId,
        top_causes: [{ description: payload.rootCause, confidence: payload.confidence }],
        confidence: payload.confidence,
        safety_flags: payload.safetyFlags,
        technician_questions: payload.technicianQuestions,
      }, { onConflict: 'case_id,run_id' })
    if (error) throw error
    return
  }
  demoStore.diagnoses.set(caseId, payload)
}

export async function writeVerdict(
  caseId: string,
  runId: string,
  payload: EconomicsPayload,
): Promise<void> {
  if (isSupabaseAvailable()) {
    const { error } = await getSupabaseClient()
      .from('verdicts')
      .upsert({
        case_id: caseId,
        run_id: runId,
        rrr_score: payload.rrrScore,
        label: payload.label,
        breakdown: payload.breakdown,
        repair_low_cents: payload.repairCostCents,
        replacement_value_cents: payload.replacementValueCents,
        uncertainty_note: payload.uncertaintyNote,
      }, { onConflict: 'case_id,run_id' })
    if (error) throw error
    return
  }
  demoStore.verdicts.set(caseId, payload)
}

export async function writeActionPlan(
  caseId: string,
  runId: string,
  payload: ActionPlanPayload,
): Promise<void> {
  if (isSupabaseAvailable()) {
    const { error } = await getSupabaseClient()
      .from('action_plans')
      .upsert({
        case_id: caseId,
        run_id: runId,
        steps: payload.steps,
        safety_preamble: payload.safetyPreamble ?? null,
        technician_questions: payload.technicianQuestions,
      }, { onConflict: 'case_id,run_id' })
    if (error) throw error
    return
  }
  demoStore.actionPlans.set(caseId, payload)
}

export async function writeHelperRequest(
  caseId: string,
  runId: string,
  payload: HelperRoutingPayload,
): Promise<void> {
  if (isSupabaseAvailable()) {
    const { error } = await getSupabaseClient()
      .from('helper_requests')
      .upsert({
        case_id: caseId,
        run_id: runId,
        matches: payload.matches,
      }, { onConflict: 'case_id,run_id' })
    if (error) throw error
    return
  }
  demoStore.helperRequests.set(caseId, payload)
}
