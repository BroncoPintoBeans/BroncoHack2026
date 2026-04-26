import { isRequestUserOwner } from '@/lib/auth/demo-user'
import { parseUuidParam } from '@/lib/api/route-helpers'
import { getCase } from '@/lib/db/queries/cases'
import { listEvents } from '@/lib/db/queries/events'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params
  const parsedId = parseUuidParam(id, 'case id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedId.ok) return parsedId.response

  const caseRecord = await getCase(parsedId.value)
  if (!caseRecord || !await isRequestUserOwner(request, caseRecord.userId)) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }

  const events = await listEvents(parsedId.value)
  return Response.json({ events })
}
