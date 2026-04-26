import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseRunRecord } from '../../types/case'
import type { AgentPhase } from '../../types/agents'

function dbRowToRunRecord(row: Record<string, unknown>): CaseRunRecord {
  return {
    id: row.id as string,
    caseId: row.case_id as string,
    isCurrent: row.is_current as boolean,
    status: row.status as CaseRunRecord['status'],
    currentPhase: row.current_phase as AgentPhase,
    nextPhase: row.next_phase as AgentPhase | undefined,
    awaitingQuestion: row.awaiting_question as string | undefined,
    followupCount: row.followup_count as number,
    triggerReason: row.trigger_reason as CaseRunRecord['triggerReason'],
    startedAt: row.created_at as string,
    completedAt: (row.status === 'complete' || row.status === 'failed')
      ? row.updated_at as string
      : undefined,
  }
}

export async function createRun(data: {
  caseId: string
  triggerReason: CaseRunRecord['triggerReason']
}): Promise<CaseRunRecord> {
  if (isSupabaseAvailable()) {
    // Demote any existing current run
    await getSupabaseClient()
      .from('case_runs')
      .update({ is_current: false })
      .eq('case_id', data.caseId)
      .eq('is_current', true)

    const id = crypto.randomUUID()
    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .insert({
        id,
        case_id: data.caseId,
        is_current: true,
        status: 'running',
        current_phase: 'intake',
        followup_count: 0,
        trigger_reason: data.triggerReason,
      })
      .select()
      .single()
    if (error) throw error
    return dbRowToRunRecord(row as Record<string, unknown>)
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
    const { data: row } = await getSupabaseClient()
      .from('case_runs')
      .select()
      .eq('case_id', caseId)
      .eq('is_current', true)
      .maybeSingle()
    return row ? dbRowToRunRecord(row as Record<string, unknown>) : null
  }

  const runId = demoStore.runsByCaseId.get(caseId)
  if (!runId) return null
  return demoStore.runs.get(runId) ?? null
}

export async function updateRun(
  runId: string,
  data: Partial<Pick<CaseRunRecord, 'status' | 'currentPhase' | 'nextPhase' | 'awaitingQuestion' | 'followupCount'>>,
): Promise<CaseRunRecord> {
  if (isSupabaseAvailable()) {
    const patch: Record<string, unknown> = {}
    if (data.status !== undefined) patch.status = data.status
    if (data.currentPhase !== undefined) patch.current_phase = data.currentPhase
    if (data.nextPhase !== undefined) patch.next_phase = data.nextPhase
    if (data.awaitingQuestion !== undefined) patch.awaiting_question = data.awaitingQuestion
    if (data.followupCount !== undefined) patch.followup_count = data.followupCount
    const { data: row, error } = await getSupabaseClient()
      .from('case_runs')
      .update(patch)
      .eq('id', runId)
      .select()
      .single()
    if (error) throw error
    return dbRowToRunRecord(row as Record<string, unknown>)
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
