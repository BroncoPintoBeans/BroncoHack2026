import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import { getCase } from './cases'
import { getCurrentRun } from './runs'
import { listEvents } from './events'
import type { CurrentCaseOutput } from '../../types/case'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperMatch } from '../../types/payloads'

export async function getCurrentCaseOutput(caseId: string): Promise<CurrentCaseOutput | null> {
  if (isSupabaseAvailable()) {
    const supabase = getSupabaseClient()

    const caseRecord = await getCase(caseId)
    if (!caseRecord) return null

    const currentRun = await getCurrentRun(caseId)
    const events = await listEvents(caseId)

    // Load outputs for current run
    let diagnosis: DiagnosisCompletePayload | undefined
    let verdict: EconomicsPayload | undefined
    let actionPlan: ActionPlanPayload | undefined
    let helperMatches: HelperMatch[] | undefined

    if (currentRun) {
      const [diagRow, verdictRow, planRow, helperRow] = await Promise.all([
        supabase.from('diagnoses').select().eq('case_id', caseId).eq('run_id', currentRun.id).maybeSingle(),
        supabase.from('verdicts').select().eq('case_id', caseId).eq('run_id', currentRun.id).maybeSingle(),
        supabase.from('action_plans').select().eq('case_id', caseId).eq('run_id', currentRun.id).maybeSingle(),
        supabase.from('helper_requests').select().eq('case_id', caseId).eq('run_id', currentRun.id).maybeSingle(),
      ])

      if (diagRow.data) {
        const d = diagRow.data as Record<string, unknown>
        const topCauses = (d.top_causes as Array<{ description: string }> | null) ?? []
        diagnosis = {
          rootCause: topCauses[0]?.description ?? '',
          confidence: d.confidence as number,
          safetyFlags: (d.safety_flags as string[]) ?? [],
          technicianQuestions: (d.technician_questions as string[]) ?? [],
          awaitingUser: false,
        }
      }

      if (verdictRow.data) {
        const v = verdictRow.data as Record<string, unknown>
        verdict = {
          rrrScore: v.rrr_score as number,
          label: v.label as EconomicsPayload['label'],
          breakdown: v.breakdown as EconomicsPayload['breakdown'],
          repairCostCents: v.repair_low_cents as number,
          replacementValueCents: v.replacement_value_cents as number,
          uncertaintyNote: v.uncertainty_note as string,
        }
      }

      if (planRow.data) {
        const p = planRow.data as Record<string, unknown>
        actionPlan = {
          steps: p.steps as ActionPlanPayload['steps'],
          safetyPreamble: p.safety_preamble as string | undefined,
          technicianQuestions: (p.technician_questions as string[]) ?? [],
        }
      }

      if (helperRow.data) {
        const h = helperRow.data as Record<string, unknown>
        helperMatches = (h.matches as HelperMatch[]) ?? []
      }
    }

    return { case: caseRecord, currentRun: currentRun ?? undefined, diagnosis, verdict, actionPlan, helperMatches, events }
  }

  // Demo-store path
  const caseRecord = demoStore.cases.get(caseId)
  if (!caseRecord) return null

  const runId = demoStore.runsByCaseId.get(caseId)
  const currentRun = runId ? demoStore.runs.get(runId) : undefined
  const events = demoStore.events.get(caseId) ?? []
  const diagnosis = demoStore.diagnoses.get(caseId)
  const verdict = demoStore.verdicts.get(caseId)
  const actionPlan = demoStore.actionPlans.get(caseId)
  const helperRequest = demoStore.helperRequests.get(caseId)
  const helperMatches = helperRequest?.matches

  return { case: caseRecord, currentRun, diagnosis, verdict, actionPlan, helperMatches, events }
}
