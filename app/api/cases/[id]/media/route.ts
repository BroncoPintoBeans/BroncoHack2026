import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { isRequestUserOwner } from '@/lib/auth/demo-user'
import {
  internalServerError,
  logServerError,
  parseUuidParam,
} from '@/lib/api/route-helpers'
import { isSupabaseAvailable, getSupabaseClient } from '@/lib/db/client'
import { getCase } from '@/lib/db/queries/cases'
import { saveDemoCaseMedia } from '@/lib/db/queries/media'
import type { CreateMediaResponse } from '@/lib/types/api'

const CASE_MEDIA_BUCKET = 'case-media'
const MAX_MEDIA_PER_CASE = 3
const MAX_FILE_BYTES = 8 * 1024 * 1024
const ALLOWED_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const JsonMediaBodySchema = z.object({
  url: z.string().min(1).refine((value) => value.startsWith('data:image/') || value.startsWith('data:video/'), {
    message: 'URL must be a local image/video data URL in demo mode',
  }),
  mediaType: z.enum(['image', 'video']),
})

function safeFileName(fileName: string): string {
  const normalized = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
  return normalized.replace(/^-+|-+$/g, '').slice(0, 96) || 'upload'
}

function mediaTypeFromMime(mimeType: string): 'image' | 'video' {
  return mimeType.startsWith('video/') ? 'video' : 'image'
}

async function fileToDataUrl(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer()).toString('base64')
  return `data:${file.type};base64,${bytes}`
}

function validateUploadFile(file: File): Response | null {
  if (file.size <= 0) {
    return Response.json({ error: 'File is empty' }, { status: 422 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: 'File too large' }, { status: 413 })
  }
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    return Response.json({ error: 'Unsupported media type' }, { status: 422 })
  }
  return null
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

  const mediaId = crypto.randomUUID()
  const now = new Date().toISOString()
  const contentType = request.headers.get('content-type') ?? ''

  if (!isSupabaseAvailable() && contentType.includes('application/json')) {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const parsed = JsonMediaBodySchema.safeParse(body)
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 422 })
    }

    const existing = await saveDemoCaseMedia({
      id: mediaId,
      caseId: parsedId.value,
      url: parsed.data.url,
      mediaType: parsed.data.mediaType,
      createdAt: now,
    })
    return Response.json({ media: existing } satisfies CreateMediaResponse, { status: 201 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Expected multipart form data with a file field' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return Response.json({ error: 'Missing file field' }, { status: 422 })
  }

  const invalidFileResponse = validateUploadFile(file)
  if (invalidFileResponse) return invalidFileResponse

  const mediaType = mediaTypeFromMime(file.type)

  if (isSupabaseAvailable()) {
    const { count, error: countError } = await getSupabaseClient()
      .from('case_media')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', parsedId.value)
    if (countError) {
      logServerError('Failed to count case media', countError, { caseId: parsedId.value })
      return internalServerError('Failed to save media')
    }
    if ((count ?? 0) >= MAX_MEDIA_PER_CASE) {
      return Response.json({ error: 'A case can have at most 3 media uploads' }, { status: 409 })
    }

    const storagePath = `${caseRecord.userId}/${parsedId.value}/${mediaId}-${safeFileName(file.name)}`
    const { error: uploadError } = await getSupabaseClient()
      .storage
      .from(CASE_MEDIA_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      })
    if (uploadError) {
      logServerError('Failed to upload case media', uploadError, { caseId: parsedId.value })
      return internalServerError('Failed to upload media')
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

    const { data: signed, error: signedError } = await getSupabaseClient()
      .storage
      .from(CASE_MEDIA_BUCKET)
      .createSignedUrl(storagePath, 60 * 60)
    if (signedError) {
      logServerError('Failed to sign case media URL', signedError, { caseId: parsedId.value })
      return internalServerError('Failed to read media')
    }

    return Response.json(
      {
        media: {
          id: (data as Record<string, unknown>).id as string,
          caseId: parsedId.value,
          storagePath,
          url: signed.signedUrl,
          mediaType,
          createdAt: (data as Record<string, unknown>).created_at as string,
        },
      } satisfies CreateMediaResponse,
      { status: 201 },
    )
  }

  const media = await saveDemoCaseMedia({
    id: mediaId,
    caseId: parsedId.value,
    url: await fileToDataUrl(file),
    mediaType,
    createdAt: now,
  })

  return Response.json(
    { media } satisfies CreateMediaResponse,
    { status: 201 },
  )
}
