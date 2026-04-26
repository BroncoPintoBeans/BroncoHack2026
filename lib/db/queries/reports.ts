import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseMediaRecord, CaseRecord, CaseReportRecord } from '../../types/case'
import type {
  ActionPlanPayload,
  DiagnosisCompletePayload,
  EconomicsPayload,
  HelperRoutingPayload,
} from '../../types/payloads'
import { getCase } from './cases'
import { assertNoSupabaseError } from './validation'

export interface MaterializeReportInput {
  caseRecord: CaseRecord
  runId: string
  diagnosis: DiagnosisCompletePayload
  verdict: EconomicsPayload
  actionPlan: ActionPlanPayload
  helperRouting: HelperRoutingPayload
}

function titleForCase(caseRecord: CaseRecord) {
  const category = caseRecord.category.replace(/_/g, ' ')
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} repair help`
}

function summaryForCase(caseRecord: CaseRecord, diagnosis: DiagnosisCompletePayload, verdict: EconomicsPayload) {
  return [
    caseRecord.symptoms,
    diagnosis.rootCause ? `Likely issue: ${diagnosis.rootCause}` : '',
    `Verdict: ${verdict.label.replace(/_/g, ' ')}.`,
  ].filter(Boolean).join(' ')
}

function helperTemplateFor(actionPlan: ActionPlanPayload) {
  if (actionPlan.technicianQuestions.length > 0) {
    return `Can someone help verify: ${actionPlan.technicianQuestions.join('; ')}`
  }
  const firstStep = actionPlan.steps[0]
  return firstStep ? `Could use help with: ${firstStep.title}. ${firstStep.description}` : null
}

function skillTagsFor(caseRecord: CaseRecord, actionPlan: ActionPlanPayload) {
  const tags = new Set<string>([caseRecord.category])
  for (const step of actionPlan.steps) {
    if (step.involvesElectricity) tags.add('electronics')
    if (step.involvesDisassembly) tags.add('disassembly')
    if (step.involvesHeat) tags.add('heat-safe')
  }
  return [...tags].slice(0, 10)
}

function rowToCaseReport(row: Record<string, unknown>): CaseReportRecord {
  return {
    id: String(row.id),
    caseId: String(row.case_id),
    runId: String(row.run_id),
    userId: String(row.user_id),
    reportJson: row.report_json as CaseReportRecord['reportJson'],
    boardSummaryJson: row.board_summary_json as CaseReportRecord['boardSummaryJson'],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

async function listCaseMedia(caseId: string): Promise<CaseMediaRecord[]> {
  if (!isSupabaseAvailable()) return []

  const { data, error } = await getSupabaseClient()
    .from('case_media')
    .select('id,case_id,storage_path,media_type,created_at')
    .eq('case_id', caseId)
    .order('ordinal', { ascending: true })

  assertNoSupabaseError(error, 'listCaseMedia select')

  const client = getSupabaseClient()

  return Promise.all((data ?? []).map(async (row) => {
    const storagePath = String(row.storage_path)
    let url = storagePath
    if (!/^https?:\/\//i.test(storagePath) && !storagePath.startsWith('data:')) {
      const { data: signed } = await client.storage.from('case-media').createSignedUrl(storagePath, 60 * 60)
      url = signed?.signedUrl ?? storagePath
    }
    return {
      id: String(row.id),
      caseId: String(row.case_id),
      url,
      mediaType: row.media_type === 'video' ? 'video' as const : 'image' as const,
      createdAt: String(row.created_at),
    }
  }))
}

export async function materializeCaseReport(input: MaterializeReportInput): Promise<CaseReportRecord> {
  const media = await listCaseMedia(input.caseRecord.id)
  const now = new Date().toISOString()
  const reportJson: CaseReportRecord['reportJson'] = {
    diagnosis: input.diagnosis,
    verdict: input.verdict,
    actionPlan: input.actionPlan,
    helperRouting: input.helperRouting,
    media,
    followups: [],
  }
  const boardSummaryJson: CaseReportRecord['boardSummaryJson'] = {
    title: titleForCase(input.caseRecord),
    publicSummary: summaryForCase(input.caseRecord, input.diagnosis, input.verdict).slice(0, 2000),
    helperRequestTemplate: helperTemplateFor(input.actionPlan),
    category: input.caseRecord.category,
    urgency: input.caseRecord.urgency,
    skillTags: skillTagsFor(input.caseRecord, input.actionPlan),
    safetyFlags: input.diagnosis.safetyFlags,
    verdictLabel: input.verdict.label,
    rrrScore: input.verdict.rrrScore,
  }

  if (isSupabaseAvailable()) {
    const { data, error } = await getSupabaseClient()
      .from('case_reports')
      .upsert({
        run_id: input.runId,
        case_id: input.caseRecord.id,
        user_id: input.caseRecord.userId,
        report_json: reportJson,
        board_summary_json: boardSummaryJson,
        updated_at: now,
      }, { onConflict: 'run_id' })
      .select()
      .single()
    assertNoSupabaseError(error, 'materializeCaseReport upsert')
    if (!data) throw new Error('materializeCaseReport upsert: missing row')
    return rowToCaseReport(data as Record<string, unknown>)
  }

  const existingId = demoStore.caseReportsByRunId.get(input.runId)
  const id = existingId ?? crypto.randomUUID()
  const record: CaseReportRecord = {
    id,
    caseId: input.caseRecord.id,
    runId: input.runId,
    userId: input.caseRecord.userId,
    reportJson,
    boardSummaryJson,
    createdAt: demoStore.caseReports.get(id)?.createdAt ?? now,
    updatedAt: now,
  }
  demoStore.caseReports.set(id, record)
  demoStore.caseReportsByRunId.set(input.runId, id)
  demoStore.caseReportsByCaseId.set(input.caseRecord.id, id)
  return record
}

export async function getLatestCaseReport(caseId: string): Promise<CaseReportRecord | null> {
  if (isSupabaseAvailable()) {
    const { data, error } = await getSupabaseClient()
      .from('case_reports')
      .select()
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    assertNoSupabaseError(error, 'getLatestCaseReport select')
    return data ? rowToCaseReport(data as Record<string, unknown>) : null
  }

  const id = demoStore.caseReportsByCaseId.get(caseId)
  return id ? demoStore.caseReports.get(id) ?? null : null
}

export async function getCaseReport(reportId: string): Promise<CaseReportRecord | null> {
  if (isSupabaseAvailable()) {
    const { data, error } = await getSupabaseClient()
      .from('case_reports')
      .select()
      .eq('id', reportId)
      .maybeSingle()
    assertNoSupabaseError(error, 'getCaseReport select')
    return data ? rowToCaseReport(data as Record<string, unknown>) : null
  }

  return demoStore.caseReports.get(reportId) ?? null
}

export async function getLatestCaseReportOrThrow(caseId: string): Promise<CaseReportRecord> {
  const [caseRecord, report] = await Promise.all([getCase(caseId), getLatestCaseReport(caseId)])
  if (!caseRecord) throw Object.assign(new Error('case not found'), { status: 404 })
  if (!report) throw Object.assign(new Error('completed report required before publishing'), { status: 409 })
  return report
}
