import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type {
  CaseRecord,
  CaseReportBoardSummary,
  CaseReportJson,
  CaseReportRecord,
  CaseRunRecord,
} from '../../types/case'
import type {
  ActionPlanPayload,
  DiagnosisCompletePayload,
  EconomicsPayload,
  HelperMatch,
} from '../../types/payloads'
import { getCase } from './cases'
import { listEvents } from './events'
import { listCaseMedia } from './media'
import { getRun } from './runs'
import {
  ActionPlanRowSchema,
  assertNoSupabaseError,
  DiagnosisRowSchema,
  HelperRequestRowSchema,
  parseDbRow,
  VerdictRowSchema,
} from './validation'

type ReportRow = {
  id: string
  case_id: string
  run_id: string
  user_id: string
  report_version: number
  report_json: CaseReportJson
  board_summary_json: CaseReportBoardSummary
  created_at: string
  updated_at: string
}

function reportRowToRecord(row: ReportRow): CaseReportRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    runId: row.run_id,
    userId: row.user_id,
    reportVersion: row.report_version,
    reportJson: row.report_json,
    boardSummaryJson: row.board_summary_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function categoryLabel(category: string): string {
  return category
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}

function compactText(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`
}

function skillTagsFor(caseRecord: CaseRecord, diagnosis: DiagnosisCompletePayload | null): string[] {
  const tags = new Set<string>([caseRecord.category])
  for (const flag of diagnosis?.safetyFlags ?? []) tags.add(flag)
  if ((diagnosis?.rootCause ?? '').toLowerCase().includes('battery')) tags.add('battery')
  if ((diagnosis?.rootCause ?? '').toLowerCase().includes('display')) tags.add('display')
  return [...tags].slice(0, 6)
}

export function buildBoardSafeSummary(input: {
  caseRecord: CaseRecord
  diagnosis: DiagnosisCompletePayload | null
  verdict: EconomicsPayload | null
  actionPlan: ActionPlanPayload | null
}): CaseReportBoardSummary {
  const item = categoryLabel(input.caseRecord.category)
  const rootCause = input.diagnosis?.rootCause
    ? compactText(input.diagnosis.rootCause, 120)
    : 'repair diagnosis'
  const firstSteps = (input.actionPlan?.steps ?? [])
    .slice(0, 3)
    .map((step) => `${step.order}. ${step.title}`)
    .join(' ')
  const publicSummary = compactText(
    `${item}: ${input.caseRecord.symptoms} Likely issue: ${rootCause}.`,
    700,
  )
  const helperRequestTemplate = compactText(
    [
      `I need help with a ${item.toLowerCase()} repair.`,
      `Symptoms: ${input.caseRecord.symptoms}`,
      rootCause ? `Likely issue: ${rootCause}` : null,
      firstSteps ? `Suggested first steps: ${firstSteps}` : null,
    ].filter(Boolean).join(' '),
    1000,
  )

  return {
    title: compactText(`${item} help: ${rootCause}`, 160),
    publicSummary,
    helperRequestTemplate,
    category: input.caseRecord.category,
    urgency: input.caseRecord.urgency,
    skillTags: skillTagsFor(input.caseRecord, input.diagnosis),
    safetyFlags: input.diagnosis?.safetyFlags ?? [],
    verdictLabel: input.verdict?.label ?? null,
    rrrScore: input.verdict?.rrrScore ?? null,
  }
}

function diagnosisFromDemo(caseId: string): DiagnosisCompletePayload | null {
  return demoStore.diagnoses.get(caseId) ?? null
}

function verdictFromDemo(caseId: string): EconomicsPayload | null {
  return demoStore.verdicts.get(caseId) ?? null
}

function actionPlanFromDemo(caseId: string): ActionPlanPayload | null {
  return demoStore.actionPlans.get(caseId) ?? null
}

function helperMatchesFromDemo(caseId: string): HelperMatch[] {
  return demoStore.helperRequests.get(caseId)?.matches ?? []
}

async function loadSupabaseOutputs(caseId: string, runId: string): Promise<{
  diagnosis: DiagnosisCompletePayload | null
  verdict: EconomicsPayload | null
  actionPlan: ActionPlanPayload | null
  helperMatches: HelperMatch[]
}> {
  const supabase = await getSupabaseClient()
  const [diagRow, verdictRow, planRow, helperRow] = await Promise.all([
    supabase.from('diagnoses').select().eq('case_id', caseId).eq('run_id', runId).maybeSingle(),
    supabase.from('verdicts').select().eq('case_id', caseId).eq('run_id', runId).maybeSingle(),
    supabase.from('action_plans').select().eq('case_id', caseId).eq('run_id', runId).maybeSingle(),
    supabase.from('helper_routing_results').select().eq('case_id', caseId).eq('run_id', runId).maybeSingle(),
  ])
  assertNoSupabaseError(diagRow.error, 'loadSupabaseOutputs diagnoses select')
  assertNoSupabaseError(verdictRow.error, 'loadSupabaseOutputs verdicts select')
  assertNoSupabaseError(planRow.error, 'loadSupabaseOutputs action_plans select')
  assertNoSupabaseError(helperRow.error, 'loadSupabaseOutputs helper_routing_results select')

  let diagnosis: DiagnosisCompletePayload | null = null
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

  let verdict: EconomicsPayload | null = null
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

  let actionPlan: ActionPlanPayload | null = null
  if (planRow.data) {
    const p = parseDbRow(ActionPlanRowSchema, planRow.data, 'action_plans row')
    actionPlan = {
      steps: p.steps as ActionPlanPayload['steps'],
      safetyPreamble: p.safety_preamble ?? undefined,
      technicianQuestions: p.technician_questions ?? [],
    }
  }

  const helperMatches = helperRow.data
    ? ((parseDbRow(HelperRequestRowSchema, helperRow.data, 'helper_routing_results row').matches ?? []) as HelperMatch[])
    : []

  return { diagnosis, verdict, actionPlan, helperMatches }
}

function buildReportJson(input: {
  caseRecord: CaseRecord
  runRecord: CaseRunRecord
  diagnosis: DiagnosisCompletePayload | null
  verdict: EconomicsPayload | null
  actionPlan: ActionPlanPayload | null
  helperMatches: HelperMatch[]
  media: Awaited<ReturnType<typeof listCaseMedia>>
  events: Awaited<ReturnType<typeof listEvents>>
  generatedAt: string
}): CaseReportJson {
  return {
    version: 1,
    generatedAt: input.generatedAt,
    case: {
      id: input.caseRecord.id,
      category: input.caseRecord.category,
      symptoms: input.caseRecord.symptoms,
      urgency: input.caseRecord.urgency,
      modelNumber: input.caseRecord.modelNumber,
      quoteCents: input.caseRecord.quoteCents,
    },
    run: {
      id: input.runRecord.id,
      status: input.runRecord.status,
      currentPhase: input.runRecord.currentPhase,
      followupCount: input.runRecord.followupCount,
      startedAt: input.runRecord.startedAt,
      completedAt: input.runRecord.completedAt,
    },
    diagnosis: input.diagnosis,
    verdict: input.verdict,
    actionPlan: input.actionPlan,
    helperRouting: { matches: input.helperMatches },
    media: input.media,
    followUps: input.events
      .filter((event) => event.phase === 'diagnosis' && event.status === 'awaiting_user')
      .map((event) => {
        const payload = event.payload as { question?: unknown; options?: unknown } | undefined
        return {
          question: typeof payload?.question === 'string' ? payload.question : '',
          options: Array.isArray(payload?.options) ? payload.options.filter((opt): opt is string => typeof opt === 'string') : [],
          createdAt: event.createdAt,
        }
      })
      .filter((followUp) => followUp.question.length > 0),
    imageAnnotations: [],
  }
}

export async function createOrUpdateCaseReportForRun(caseId: string, runId: string): Promise<CaseReportRecord> {
  const [caseRecord, runRecord] = await Promise.all([getCase(caseId), getRun(runId)])
  if (!caseRecord) throw new Error(`Case ${caseId} not found`)
  if (!runRecord) throw new Error(`Run ${runId} not found`)
  if (runRecord.caseId !== caseId) throw new Error(`Run ${runId} does not belong to case ${caseId}`)

  const generatedAt = new Date().toISOString()
  const [media, events, outputs] = await Promise.all([
    listCaseMedia(caseId),
    listEvents(caseId),
    isSupabaseAvailable()
      ? loadSupabaseOutputs(caseId, runId)
      : Promise.resolve({
        diagnosis: diagnosisFromDemo(caseId),
        verdict: verdictFromDemo(caseId),
        actionPlan: actionPlanFromDemo(caseId),
        helperMatches: helperMatchesFromDemo(caseId),
      }),
  ])

  const boardSummaryJson = buildBoardSafeSummary({
    caseRecord,
    diagnosis: outputs.diagnosis,
    verdict: outputs.verdict,
    actionPlan: outputs.actionPlan,
  })
  const reportJson = buildReportJson({
    caseRecord,
    runRecord,
    diagnosis: outputs.diagnosis,
    verdict: outputs.verdict,
    actionPlan: outputs.actionPlan,
    helperMatches: outputs.helperMatches,
    media,
    events,
    generatedAt,
  })

  if (isSupabaseAvailable()) {
    const id = crypto.randomUUID()
    const { data: row, error } = await (await getSupabaseClient())
      .from('case_reports')
      .upsert({
        id,
        case_id: caseId,
        run_id: runId,
        user_id: caseRecord.userId,
        report_version: 1,
        report_json: reportJson,
        board_summary_json: boardSummaryJson,
        updated_at: generatedAt,
      }, { onConflict: 'run_id' })
      .select()
      .single()
    assertNoSupabaseError(error, 'createOrUpdateCaseReportForRun upsert')
    if (!row) throw new Error('createOrUpdateCaseReportForRun upsert: missing row')
    return reportRowToRecord(row as ReportRow)
  }

  const existingId = demoStore.caseReportsByRunId.get(runId)
  const existing = existingId ? demoStore.caseReports.get(existingId) : undefined
  const record: CaseReportRecord = {
    id: existing?.id ?? crypto.randomUUID(),
    caseId,
    runId,
    userId: caseRecord.userId,
    reportVersion: 1,
    reportJson,
    boardSummaryJson,
    createdAt: existing?.createdAt ?? generatedAt,
    updatedAt: generatedAt,
  }
  demoStore.caseReports.set(record.id, record)
  demoStore.caseReportsByRunId.set(runId, record.id)
  return record
}

export async function getLatestCaseReport(caseId: string): Promise<CaseReportRecord | null> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await (await getSupabaseClient())
      .from('case_reports')
      .select()
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    assertNoSupabaseError(error, 'getLatestCaseReport select')
    return row ? reportRowToRecord(row as ReportRow) : null
  }

  return [...demoStore.caseReports.values()]
    .filter((report) => report.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
}

export async function getCaseReport(reportId: string): Promise<CaseReportRecord | null> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await (await getSupabaseClient())
      .from('case_reports')
      .select()
      .eq('id', reportId)
      .maybeSingle()
    assertNoSupabaseError(error, 'getCaseReport select')
    return row ? reportRowToRecord(row as ReportRow) : null
  }

  return demoStore.caseReports.get(reportId) ?? null
}
