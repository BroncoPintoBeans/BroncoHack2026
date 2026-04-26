import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseEventRecord } from '../../types/case'
import type { AgentPhase, PhaseStatus } from '../../types/agents'

function dbRowToEventRecord(row: Record<string, unknown>): CaseEventRecord {
  return {
    id: String(row.id),
    caseId: row.case_id as string,
    runId: row.run_id as string,
    phase: row.phase as AgentPhase,
    status: row.status as PhaseStatus,
    payload: row.payload as unknown,
    createdAt: row.created_at as string,
  }
}

export async function insertEvent(
  event: Omit<CaseEventRecord, 'id' | 'createdAt'>,
): Promise<CaseEventRecord> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await getSupabaseClient()
      .from('case_events')
      .insert({
        case_id: event.caseId,
        run_id: event.runId,
        phase: event.phase,
        status: event.status,
        payload: event.payload ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return dbRowToEventRecord(row as Record<string, unknown>)
  }

  const id = crypto.randomUUID()
  const record: CaseEventRecord = { ...event, id, createdAt: new Date().toISOString() }
  const existing = demoStore.events.get(event.caseId) ?? []
  existing.push(record)
  demoStore.events.set(event.caseId, existing)
  return record
}

export async function listEvents(caseId: string): Promise<CaseEventRecord[]> {
  if (isSupabaseAvailable()) {
    const { data: rows } = await getSupabaseClient()
      .from('case_events')
      .select()
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    return (rows ?? []).map(r => dbRowToEventRecord(r as Record<string, unknown>))
  }
  return demoStore.events.get(caseId) ?? []
}
