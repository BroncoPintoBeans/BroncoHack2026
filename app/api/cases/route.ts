import { z } from 'zod'
import { createCase, listCases } from '@/lib/db/queries/cases'
import { getRequestUserId } from '@/lib/auth/demo-user'
import type { CreateCaseResponse, ListCasesResponse } from '@/lib/types/api'

const MAX_TEXT_LENGTH = 8_000
const MAX_MODEL_NUMBER_LENGTH = 120
const MAX_INT32 = 2_147_483_647

const CreateCaseSchema = z.object({
  category: z.enum(['laptop', 'bicycle', 'scooter', 'mini_fridge']),
  symptoms: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  urgency: z.enum(['low', 'normal', 'urgent']).default('normal'),
  modelNumber: z.string().trim().max(MAX_MODEL_NUMBER_LENGTH).optional(),
  quoteCents: z.number().int().nonnegative().max(MAX_INT32).optional(),
})

export async function GET(request?: Request): Promise<Response> {
  const userId = await getRequestUserId(request)
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const cases = await listCases(userId)
  return Response.json({ cases } satisfies ListCasesResponse)
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = CreateCaseSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const userId = await getRequestUserId(request)
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const newCase = await createCase({ userId, ...parsed.data })
  return Response.json({ case: newCase } satisfies CreateCaseResponse, { status: 201 })
}
