import { z } from 'zod'
import { isRequestUserOwner } from '@/lib/auth/demo-user'
import { parseUuidParam } from '@/lib/api/route-helpers'
import { getCase, updateCase } from '@/lib/db/queries/cases'
import { getCurrentRun } from '@/lib/db/queries/runs'
import type { GetCaseResponse, UpdateCaseResponse } from '@/lib/types/api'

const MAX_TEXT_LENGTH = 8_000
const MAX_MODEL_NUMBER_LENGTH = 120
const MAX_INT32 = 2_147_483_647

const UpdateCaseSchema = z.object({
  symptoms: z.string().trim().min(1).max(MAX_TEXT_LENGTH).optional(),
  urgency: z.enum(['low', 'normal', 'urgent']).optional(),
  modelNumber: z.string().trim().max(MAX_MODEL_NUMBER_LENGTH).optional(),
  quoteCents: z.number().int().nonnegative().max(MAX_INT32).optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const parsedId = parseUuidParam(id, 'case id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedId.ok) return parsedId.response
  const found = await getCase(parsedId.value)
  if (!found) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  if (!await isRequestUserOwner(request, found.userId)) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  return Response.json({ case: found } satisfies GetCaseResponse)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const parsedId = parseUuidParam(id, 'case id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedId.ok) return parsedId.response

  const found = await getCase(parsedId.value)
  if (!found) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  if (!await isRequestUserOwner(request, found.userId)) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const currentRun = await getCurrentRun(parsedId.value)
  if (currentRun && (currentRun.status === 'running' || currentRun.status === 'awaiting_user')) {
    return Response.json({ error: 'Cannot update case while a run is active' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = UpdateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const updated = await updateCase(parsedId.value, parsed.data)
  return Response.json({ case: updated } satisfies UpdateCaseResponse)
}
