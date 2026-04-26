import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseRecord } from '../../types/case'
import type { CaseCategory, Urgency } from '../../types/agents'

function dbRowToCaseRecord(row: Record<string, unknown>): CaseRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    category: row.category as CaseCategory,
    symptoms: row.symptoms as string,
    urgency: row.urgency as Urgency,
    modelNumber: row.model_number as string | undefined,
    quoteCents: row.quoted_price_cents as number | undefined,
    status: row.status === 'draft' ? 'open' : (row.status as CaseRecord['status']),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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
    const { data: row, error } = await getSupabaseClient()
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
    if (error) throw error
    return dbRowToCaseRecord(row as Record<string, unknown>)
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
    const { data: row } = await getSupabaseClient().from('cases').select().eq('id', id).maybeSingle()
    return row ? dbRowToCaseRecord(row as Record<string, unknown>) : null
  }
  return demoStore.cases.get(id) ?? null
}

export async function listCases(userId: string): Promise<CaseRecord[]> {
  if (isSupabaseAvailable()) {
    const { data: rows } = await getSupabaseClient()
      .from('cases')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return (rows ?? []).map(r => dbRowToCaseRecord(r as Record<string, unknown>))
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
    const { data: row, error } = await getSupabaseClient()
      .from('cases')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return dbRowToCaseRecord(row as Record<string, unknown>)
  }

  const existing = demoStore.cases.get(id)
  if (!existing) throw new Error(`Case ${id} not found`)
  const updated: CaseRecord = { ...existing, ...data, updatedAt: new Date().toISOString() }
  demoStore.cases.set(id, updated)
  return updated
}
