import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseRunRecord } from '../../types/case'
import type { AgentPhase } from '../../types/agents'
import {
  assertNoSupabaseError,
  parseDbRow,
  RunRowSchema,
} from './validation'

function dbRowToRunRecord(row: unknown): CaseRunRecord {
  const parsed = parseDbRow(RunRowSchema, row, 'case_runs row')
  return {
    id: parsed.id,
    caseId: parsed.case_id,
    isCurrent: parsed.is_current,
    status: parsed.status,
    currentPhase: parsed.current_phase as AgentPhase,
    nextPhase: parsed.next_phase ?? undefined,
    awaitingQuestion: parsed.awaiting_question ?? undefined,
    awaitingOptions: parsed.awaiting_options ?? undefined,
    followupCount: parsed.followup_count,
    triggerReason: parsed.trigger_reason,
    startedAt: parsed.created_at,
    completedAt: (parsed.status === 'complete' || parsed.status === 'failed')
      ? parsed.updated_at
      : undefined,
  }
}

export async function createRun(data: {
  caseId: string
  userId?: string
  inputSnapshot?: unknown
  triggerReason: CaseRunRecord['triggerReason']
}): Promise<CaseRunRecord> {
  if (isSupabaseAvailable()) {
    if (!data.userId) {
      throw new Error('createRun requires userId when Supabase is enabled')
    }

    // Demote any existing current run
    const { error: demoteError } = await getSupabaseClient()
      .from('case_runs')
      .update({ is_current: false })
      .eq('case_id', data.caseId)
      .eq('is_current', true)
    assertNoSupabaseError(demoteError, 'createRun demote current run')

    const id = crypto.randomUUID()
    const { count, error: countError } = await getSupabaseClient()
      .from('case_runs')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', data.caseId)
    assertNoSupabaseError(countError, 'createRun count prior runs')

    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .insert({
        id,
        case_id: data.caseId,
        user_id: data.userId,
        run_number: (count ?? 0) + 1,
        input_snapshot: data.inputSnapshot ?? {},
        is_current: true,
        status: 'running',
        current_phase: 'intake',
        followup_count: 0,
        trigger_reason: data.triggerReason,
      })
      .select()
      .single()
    assertNoSupabaseError(error, 'createRun insert')
    if (!row) throw new Error('createRun insert: missing inserted row')
    return dbRowToRunRecord(row)
  }

  // Demo-store: demote prior current run
  const priorCurrentId = demoStore.runsByCaseId.get(data.caseId)
  if (priorCurrentId) {
    const prior = demoStore.runs.get(priorCurrentId)
    if (prior?.isCurrent) {
      demoStore.runs.set(priorCurrentId, { ...prior, isCurrent: false })
    }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const run: CaseRunRecord = {
    id,
    caseId: data.caseId,
    isCurrent: true,
    status: 'running',
    currentPhase: 'intake',
    followupCount: 0,
    triggerReason: data.triggerReason,
    startedAt: now,
  }
  demoStore.runs.set(id, run)
  demoStore.runsByCaseId.set(data.caseId, id)
  return run
}

export async function getCurrentRun(caseId: string): Promise<CaseRunRecord | null> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .select()
      .eq('case_id', caseId)
      .eq('is_current', true)
      .maybeSingle()
    assertNoSupabaseError(error, 'getCurrentRun select')
    return row ? dbRowToRunRecord(row) : null
  }

  const runId = demoStore.runsByCaseId.get(caseId)
  if (!runId) return null
  return demoStore.runs.get(runId) ?? null
}

export async function getRun(runId: string): Promise<CaseRunRecord | null> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .select()
      .eq('id', runId)
      .maybeSingle()
    assertNoSupabaseError(error, 'getRun select')
    return row ? dbRowToRunRecord(row) : null
  }
  return demoStore.runs.get(runId) ?? null
}

export async function updateRun(
  runId: string,
  data: Partial<Pick<CaseRunRecord, 'status' | 'currentPhase' | 'nextPhase' | 'awaitingQuestion' | 'awaitingOptions' | 'followupCount'>>,
): Promise<CaseRunRecord> {
  if (isSupabaseAvailable()) {
    const patch: Record<string, unknown> = {}
    if (data.status !== undefined) patch.status = data.status
    if (data.currentPhase !== undefined) patch.current_phase = data.currentPhase
    if (data.nextPhase !== undefined) patch.next_phase = data.nextPhase
    if (data.awaitingQuestion !== undefined) patch.awaiting_question = data.awaitingQuestion
    if (data.awaitingOptions !== undefined) patch.awaiting_options = data.awaitingOptions
    if (data.followupCount !== undefined) patch.followup_count = data.followupCount
    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .update(patch)
      .eq('id', runId)
      .select()
      .single()
    assertNoSupabaseError(error, 'updateRun update')
    if (!row) throw new Error('updateRun update: missing updated row')
    return dbRowToRunRecord(row)
  }

  const existing = demoStore.runs.get(runId)
  if (!existing) throw new Error(`Run ${runId} not found`)
  const updated: CaseRunRecord = { ...existing, ...data }
  if (data.status === 'complete' || data.status === 'failed') {
    updated.completedAt = new Date().toISOString()
  }
  demoStore.runs.set(runId, updated)
  return updated
}
