import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseRecord } from '../../types/case'
import type { CaseCategory, Urgency } from '../../types/agents'
import {
  assertNoSupabaseError,
  CaseRowSchema,
  isUuid,
  parseDbRow,
  parseDbRows,
} from './validation'

const SUPPORTED_CASE_CATEGORIES = ['laptop', 'bicycle', 'scooter', 'mini_fridge']
const SUPPORTED_URGENCIES = ['low', 'normal', 'urgent']
const SUPPORTED_CASE_STATUSES = ['draft', 'open', 'running', 'awaiting_user', 'complete', 'failed']

function dbRowToCaseRecord(row: unknown): CaseRecord {
  const parsed = parseDbRow(CaseRowSchema, row, 'cases row')
  return {
    id: parsed.id,
    userId: parsed.user_id,
    category: parsed.category as CaseCategory,
    symptoms: parsed.symptoms,
    urgency: parsed.urgency as Urgency,
    modelNumber: parsed.model_number ?? undefined,
    quoteCents: parsed.quoted_price_cents ?? undefined,
    status: parsed.status === 'draft' ? 'open' : parsed.status,
    createdAt: parsed.created_at,
    updatedAt: parsed.updated_at,
  }
}

function tryDbRowToCaseRecord(row: unknown): CaseRecord | null {
  try {
    return dbRowToCaseRecord(row)
  } catch {
    return null
  }
}

export async function createCase(data: {
  userId: string
  category: CaseCategory
  symptoms: string
  urgency: Urgency
  modelNumber?: string
  quoteCents?: number
}): Promise<CaseRecord> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  if (isSupabaseAvailable()) {
    const { data: row, error } = await (await getSupabaseClient())
      .from('cases')
      .insert({
        id,
        user_id: data.userId,
        category: data.category,
        symptoms: data.symptoms,
        urgency: data.urgency,
        model_number: data.modelNumber,
        quoted_price_cents: data.quoteCents,
        status: 'draft',
      })
      .select()
      .single()
    assertNoSupabaseError(error, 'createCase insert')
    if (!row) throw new Error('createCase insert: missing inserted row')
    return dbRowToCaseRecord(row)
  }

  const record: CaseRecord = {
    id,
    userId: data.userId,
    category: data.category,
    symptoms: data.symptoms,
    urgency: data.urgency,
    modelNumber: data.modelNumber,
    quoteCents: data.quoteCents,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  }
  demoStore.cases.set(id, record)
  return record
}

export async function getCase(id: string): Promise<CaseRecord | null> {
  if (isSupabaseAvailable()) {
    if (!isUuid(id)) return null

    const { data: row, error } = await (await getSupabaseClient()).from('cases').select().eq('id', id).maybeSingle()
    assertNoSupabaseError(error, 'getCase select')
    return row ? tryDbRowToCaseRecord(row) : null
  }
  return demoStore.cases.get(id) ?? null
}

export async function listCases(userId: string): Promise<CaseRecord[]> {
  if (isSupabaseAvailable()) {
    const { data: rows, error } = await (await getSupabaseClient())
      .from('cases')
      .select()
      .eq('user_id', userId)
      .in('category', SUPPORTED_CASE_CATEGORIES)
      .in('urgency', SUPPORTED_URGENCIES)
      .in('status', SUPPORTED_CASE_STATUSES)
      .order('created_at', { ascending: false })
    assertNoSupabaseError(error, 'listCases select')
    return parseDbRows(CaseRowSchema, rows ?? [], 'listCases').map(dbRowToCaseRecord)
  }
  return [...demoStore.cases.values()].filter(c => c.userId === userId)
}

export async function updateCase(
  id: string,
  data: Partial<Pick<CaseRecord, 'symptoms' | 'urgency' | 'modelNumber' | 'quoteCents' | 'status'>>,
): Promise<CaseRecord> {
  if (isSupabaseAvailable()) {
    const patch: Record<string, unknown> = {}
    if (data.symptoms !== undefined) patch.symptoms = data.symptoms
    if (data.urgency !== undefined) patch.urgency = data.urgency
    if (data.modelNumber !== undefined) patch.model_number = data.modelNumber
    if (data.quoteCents !== undefined) patch.quoted_price_cents = data.quoteCents
    if (data.status !== undefined) patch.status = data.status === 'open' ? 'draft' : data.status
    const { data: row, error } = await (await getSupabaseClient())
      .from('cases')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    assertNoSupabaseError(error, 'updateCase update')
    if (!row) throw new Error('updateCase update: missing updated row')
    return dbRowToCaseRecord(row)
  }

  const existing = demoStore.cases.get(id)
  if (!existing) throw new Error(`Case ${id} not found`)
  const updated: CaseRecord = { ...existing, ...data, updatedAt: new Date().toISOString() }
  demoStore.cases.set(id, updated)
  return updated
}
