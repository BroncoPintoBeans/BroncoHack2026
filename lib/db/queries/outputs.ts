import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperRoutingPayload } from '../../types/payloads'
import { getCase } from './cases'

async function getCaseUserId(caseId: string): Promise<string> {
  const caseRecord = await getCase(caseId)
  if (!caseRecord) throw new Error(`Case ${caseId} not found`)
  return caseRecord.userId
}

export async function writeDiagnosis(
  caseId: string,
  runId: string,
  payload: DiagnosisCompletePayload,
): Promise<void> {
  if (isSupabaseAvailable()) {
    const userId = await getCaseUserId(caseId)
    const { error } = await getSupabaseClient()
      .from('diagnoses')
      .upsert({
        case_id: caseId,
        run_id: runId,
        user_id: userId,
        top_causes: [{ description: payload.rootCause, confidence: payload.confidence }],
        confidence: payload.confidence,
        safety_flags: payload.safetyFlags,
        technician_questions: payload.technicianQuestions,
      }, { onConflict: 'run_id' })
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
    const userId = await getCaseUserId(caseId)
    const { error } = await getSupabaseClient()
      .from('verdicts')
      .upsert({
        case_id: caseId,
        run_id: runId,
        user_id: userId,
        rrr_score: payload.rrrScore,
        label: payload.label,
        rrr_breakdown: payload.breakdown,
        repair_low_cents: payload.repairCostCents,
        replacement_value_cents: payload.replacementValueCents,
        uncertainty_note: payload.uncertaintyNote,
      }, { onConflict: 'run_id' })
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
    const userId = await getCaseUserId(caseId)
    const { error } = await getSupabaseClient()
      .from('action_plans')
      .upsert({
        case_id: caseId,
        run_id: runId,
        user_id: userId,
        steps: payload.steps,
        safety_preamble: payload.safetyPreamble ?? null,
        technician_questions: payload.technicianQuestions,
      }, { onConflict: 'run_id' })
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
    const userId = await getCaseUserId(caseId)
    const { error } = await getSupabaseClient()
      .from('helper_routing_results')
      .upsert({
        case_id: caseId,
        run_id: runId,
        user_id: userId,
        matches: payload.matches,
      }, { onConflict: 'run_id' })
    if (error) throw error
    return
  }
  demoStore.helperRequests.set(caseId, payload)
}
