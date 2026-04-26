import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { isRequestUserOwner } from '@/lib/auth/demo-user'
import {
  internalServerError,
  isSafeExternalMediaUrl,
  logServerError,
  parseUuidParam,
} from '@/lib/api/route-helpers'
import { isSupabaseAvailable, getSupabaseClient } from '@/lib/db/client'
import { getCase } from '@/lib/db/queries/cases'

const MediaBodySchema = z.object({
  url: z.string().url().refine(isSafeExternalMediaUrl, {
    message: 'URL must be a public http(s) URL',
  }),
  fileType: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/i, {
    message: 'fileType must be an image/* or video/* MIME type',
  }),
  fileName: z.string().max(255).regex(/^[\w\-. ]+$/).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const parsedId = parseUuidParam(id, 'case id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedId.ok) return parsedId.response

  const caseRecord = await getCase(parsedId.value)
  if (!caseRecord) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  if (!await isRequestUserOwner(request, caseRecord.userId)) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = MediaBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { url, fileType, fileName } = parsed.data
  const mediaType: 'image' | 'video' = fileType.startsWith('video/') ? 'video' : 'image'
  const mediaId = crypto.randomUUID()
  const now = new Date().toISOString()

  if (isSupabaseAvailable()) {
    const { count, error: countError } = await getSupabaseClient()
      .from('case_media')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', parsedId.value)
    if (countError) {
      logServerError('Failed to count case media', countError, { caseId: parsedId.value })
      return internalServerError('Failed to save media')
    }

    const { data, error } = await getSupabaseClient()
      .from('case_media')
      .insert({
        id: mediaId,
        case_id: parsedId.value,
        user_id: caseRecord.userId,
        storage_path: url,
        media_type: mediaType,
        ordinal: count ?? 0,
      })
      .select()
      .single()
    if (error) {
      logServerError('Failed to insert case media', error, { caseId: parsedId.value })
      return internalServerError('Failed to save media')
    }
    return Response.json(
      {
        id: (data as Record<string, unknown>).id,
        caseId: parsedId.value,
        url,
        mediaType,
        createdAt: (data as Record<string, unknown>).created_at,
      },
      { status: 201 },
    )
  }

  return Response.json(
    { id: mediaId, caseId: parsedId.value, url, mediaType, fileName: fileName ?? null, createdAt: now },
    { status: 201 },
  )
}
