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
  }).optional(),
  dataUrl: z.string().startsWith('data:').optional(),
  mediaType: z.enum(['image', 'video']).optional(),
  fileType: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/i, {
    message: 'fileType must be an image/* or video/* MIME type',
  }).optional(),
  fileName: z.string().max(255).regex(/^[\w\-. ]+$/).optional(),
}).refine((data) => Boolean(data.url || data.dataUrl), {
  message: 'url or dataUrl is required',
})

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid dataUrl')
  return {
    contentType: match[1],
    bytes: Buffer.from(match[2], 'base64'),
  }
}

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

  const { url, dataUrl, fileName } = parsed.data
  const decoded = dataUrl ? decodeDataUrl(dataUrl) : null
  const fileType = parsed.data.fileType ?? decoded?.contentType ?? (parsed.data.mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
  const mediaType: 'image' | 'video' = (parsed.data.mediaType ?? (fileType.startsWith('video/') ? 'video' : 'image'))
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

    let storagePath = url ?? ''
    if (decoded) {
      const extension = fileName?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || (mediaType === 'video' ? 'mp4' : 'jpg')
      storagePath = `${caseRecord.userId}/${parsedId.value}/${mediaId}.${extension}`
      const { error: uploadError } = await getSupabaseClient()
        .storage
        .from('case-media')
        .upload(storagePath, decoded.bytes, {
          contentType: fileType,
          upsert: false,
        })
      if (uploadError) {
        logServerError('Failed to upload case media', uploadError, { caseId: parsedId.value })
        return internalServerError('Failed to upload media')
      }
    }

    const { data, error } = await getSupabaseClient()
      .from('case_media')
      .insert({
        id: mediaId,
        case_id: parsedId.value,
        user_id: caseRecord.userId,
        storage_path: storagePath,
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
        url: storagePath,
        mediaType,
        createdAt: (data as Record<string, unknown>).created_at,
      },
      { status: 201 },
    )
  }

  return Response.json(
    { id: mediaId, caseId: parsedId.value, url: url ?? dataUrl ?? '', mediaType, fileName: fileName ?? null, createdAt: now },
    { status: 201 },
  )
}
