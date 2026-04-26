import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import { getCase } from './cases'
import { getCurrentRun } from './runs'
import { listEvents } from './events'
import { listCaseMedia } from './media'
import { createOrUpdateCaseReportForRun, getLatestCaseReport } from './reports'
import type { CurrentCaseOutput } from '../../types/case'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperMatch } from '../../types/payloads'
import {
  ActionPlanRowSchema,
  assertNoSupabaseError,
  DiagnosisRowSchema,
  HelperRequestRowSchema,
  parseDbRow,
  VerdictRowSchema,
} from './validation'

export async function getCurrentCaseOutput(caseId: string): Promise<CurrentCaseOutput | null> {
  if (isSupabaseAvailable()) {
    const supabase = await getSupabaseClient()

    const caseRecord = await getCase(caseId)
    if (!caseRecord) return null

    const currentRun = await getCurrentRun(caseId)
    const [events, media] = await Promise.all([
      listEvents(caseId),
      listCaseMedia(caseId),
    ])

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
        supabase.from('helper_routing_results').select().eq('case_id', caseId).eq('run_id', currentRun.id).maybeSingle(),
      ])
      assertNoSupabaseError(diagRow.error, 'getCurrentCaseOutput diagnoses select')
      assertNoSupabaseError(verdictRow.error, 'getCurrentCaseOutput verdicts select')
      assertNoSupabaseError(planRow.error, 'getCurrentCaseOutput action_plans select')
      assertNoSupabaseError(helperRow.error, 'getCurrentCaseOutput helper_routing_results select')

      if (diagRow.data) {
        const d = parseDbRow(DiagnosisRowSchema, diagRow.data, 'diagnoses row')
        const topCauses = d.top_causes ?? []
        diagnosis = {
          rootCause: topCauses[0]?.description ?? '',
          confidence: d.confidence,
          safetyFlags: d.safety_flags ?? [],
          technicianQuestions: d.technician_questions ?? [],
          awaitingUser: false,
        }
      }

      if (verdictRow.data) {
        const v = parseDbRow(VerdictRowSchema, verdictRow.data, 'verdicts row')
        verdict = {
          rrrScore: v.rrr_score ?? 0,
          label: v.label as EconomicsPayload['label'],
          breakdown: v.rrr_breakdown,
          repairCostCents: v.repair_low_cents ?? 0,
          replacementValueCents: v.replacement_value_cents ?? 0,
          uncertaintyNote: v.uncertainty_note ?? '',
        }
      }

      if (planRow.data) {
        const p = parseDbRow(ActionPlanRowSchema, planRow.data, 'action_plans row')
        actionPlan = {
          steps: p.steps as ActionPlanPayload['steps'],
          safetyPreamble: p.safety_preamble ?? undefined,
          technicianQuestions: p.technician_questions ?? [],
        }
      }

      if (helperRow.data) {
        const h = parseDbRow(HelperRequestRowSchema, helperRow.data, 'helper_routing_results row')
        helperMatches = (h.matches ?? []) as HelperMatch[]
      }
    }

    let report = await getLatestCaseReport(caseId)
    if (!report && currentRun?.status === 'complete') {
      report = await createOrUpdateCaseReportForRun(caseId, currentRun.id)
    }

    return { case: caseRecord, currentRun: currentRun ?? undefined, media, report: report ?? undefined, diagnosis, verdict, actionPlan, helperMatches, events }
  }

  // Demo-store path
  const caseRecord = demoStore.cases.get(caseId)
  if (!caseRecord) return null

  const runId = demoStore.runsByCaseId.get(caseId)
  const currentRun = runId ? demoStore.runs.get(runId) : undefined
  const events = demoStore.events.get(caseId) ?? []
  const media = demoStore.caseMedia.get(caseId) ?? []
  const diagnosis = demoStore.diagnoses.get(caseId)
  const verdict = demoStore.verdicts.get(caseId)
  const actionPlan = demoStore.actionPlans.get(caseId)
  const helperRequest = demoStore.helperRequests.get(caseId)
  const helperMatches = helperRequest?.matches
  let report = await getLatestCaseReport(caseId)
  if (!report && currentRun?.status === 'complete') {
    report = await createOrUpdateCaseReportForRun(caseId, currentRun.id)
  }

  return { case: caseRecord, currentRun, media, report: report ?? undefined, diagnosis, verdict, actionPlan, helperMatches, events }
}
