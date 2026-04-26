import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import type { CaseMediaRecord } from '../../types/case'
import { assertNoSupabaseError } from './validation'

const CASE_MEDIA_BUCKET = 'case-media'
const SIGNED_URL_TTL_SECONDS = 60 * 60

type CaseMediaRow = {
  id: string
  case_id: string
  storage_path: string
  media_type: 'image' | 'video'
  created_at: string
}

async function resolveStorageUrl(storagePath: string): Promise<string> {
  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:')
  ) {
    return storagePath
  }

  const { data, error } = await getSupabaseClient()
    .storage
    .from(CASE_MEDIA_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS)
  assertNoSupabaseError(error, 'resolveStorageUrl signed url')
  if (!data?.signedUrl) {
    throw new Error('resolveStorageUrl signed url: missing signed URL')
  }
  return data.signedUrl
}

function rowToMediaRecord(row: CaseMediaRow, url: string): CaseMediaRecord {
  return {
    id: row.id,
    caseId: row.case_id,
    storagePath: row.storage_path,
    url,
    mediaType: row.media_type,
    createdAt: row.created_at,
  }
}

export async function listCaseMedia(caseId: string): Promise<CaseMediaRecord[]> {
  if (isSupabaseAvailable()) {
    const { data: rows, error } = await getSupabaseClient()
      .from('case_media')
      .select('id, case_id, storage_path, media_type, created_at')
      .eq('case_id', caseId)
      .order('ordinal', { ascending: true })
      .order('created_at', { ascending: true })
    assertNoSupabaseError(error, 'listCaseMedia select')

    return Promise.all(
      ((rows ?? []) as CaseMediaRow[]).map(async (row) =>
        rowToMediaRecord(row, await resolveStorageUrl(row.storage_path)),
      ),
    )
  }

  return demoStore.caseMedia.get(caseId) ?? []
}

export async function saveDemoCaseMedia(record: CaseMediaRecord): Promise<CaseMediaRecord> {
  const media = demoStore.caseMedia.get(record.caseId) ?? []
  const next = [...media, record]
  demoStore.caseMedia.set(record.caseId, next)
  return record
}
