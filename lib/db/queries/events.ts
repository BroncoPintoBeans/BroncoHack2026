import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseEventRecord } from '../../types/case'
import type { AgentPhase, PhaseStatus } from '../../types/agents'
import { getCase } from './cases'
import {
  assertNoSupabaseError,
  EventRowSchema,
  isUuid,
  parseDbRows,
  parseDbRow,
} from './validation'

function dbRowToEventRecord(row: unknown): CaseEventRecord {
  const parsed = parseDbRow(EventRowSchema, row, 'case_events row')
  return {
    id: String(parsed.id),
    caseId: parsed.case_id,
    runId: parsed.run_id,
    phase: parsed.phase as AgentPhase,
    status: parsed.status as PhaseStatus,
    payload: parsed.payload ?? undefined,
    createdAt: parsed.created_at,
  }
}

export async function insertEvent(
  event: Omit<CaseEventRecord, 'id' | 'createdAt'>,
): Promise<CaseEventRecord> {
  if (isSupabaseAvailable()) {
    const caseRecord = await getCase(event.caseId)
    if (!caseRecord) throw new Error(`insertEvent: case ${event.caseId} not found`)

    const { data: row, error } = await (await getSupabaseClient())
      .from('case_events')
      .insert({
        case_id: event.caseId,
        run_id: event.runId,
        user_id: caseRecord.userId,
        phase: event.phase,
        status: event.status,
        payload: event.payload ?? {},
      })
      .select()
      .single()
    assertNoSupabaseError(error, 'insertEvent insert')
    if (!row) throw new Error('insertEvent insert: missing inserted row')
    return dbRowToEventRecord(row)
  }

  const id = crypto.randomUUID()
  const record: CaseEventRecord = { ...event, id, createdAt: new Date().toISOString() }
  const existing = demoStore.events.get(event.caseId) ?? []
  demoStore.events.set(event.caseId, [...existing, record])
  return record
}

export async function listEvents(caseId: string): Promise<CaseEventRecord[]> {
  if (isSupabaseAvailable()) {
    if (!isUuid(caseId)) return []

    const { data: rows, error } = await (await getSupabaseClient())
      .from('case_events')
      .select()
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })
    assertNoSupabaseError(error, 'listEvents select')
    return parseDbRows(EventRowSchema, rows ?? [], 'listEvents').map(dbRowToEventRecord)
  }
  return demoStore.events.get(caseId) ?? []
}
