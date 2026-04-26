import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { isRequestUserOwner } from '@/lib/auth/demo-user'
import { acquireCaseLock } from '@/lib/db/locks'
import { internalServerError, logServerError, parseUuidParam } from '@/lib/api/route-helpers'
import { getCase } from '@/lib/db/queries/cases'
import { getRun, updateRun } from '@/lib/db/queries/runs'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { writeDiagnosis, writeVerdict, writeActionPlan, writeHelperRequest } from '@/lib/db/queries/outputs'
import { insertEvent } from '@/lib/db/queries/events'
import { materializeCaseReport } from '@/lib/db/queries/reports'

const FollowupBodySchema = z.object({
  answer: z.string().trim().min(1).max(200),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; runId: string }> },
): Promise<Response> {
  const { id, runId } = await params
  const parsedId = parseUuidParam(id, 'case id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedId.ok) return parsedId.response
  const parsedRunId = parseUuidParam(runId, 'run id', { allowPattern: /^[a-z0-9][a-z0-9-]{1,127}$/i })
  if (!parsedRunId.ok) return parsedRunId.response

  const [caseRecord, runRecord] = await Promise.all([
    getCase(parsedId.value),
    getRun(parsedRunId.value),
  ])

  if (!caseRecord) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  if (!await isRequestUserOwner(request, caseRecord.userId)) {
    return Response.json({ error: 'Case not found' }, { status: 404 })
  }
  if (!runRecord) {
    return Response.json({ error: 'Run not found' }, { status: 404 })
  }
  if (runRecord.caseId !== parsedId.value) {
    return Response.json({ error: 'Run does not belong to this case' }, { status: 400 })
  }
  if (runRecord.status !== 'awaiting_user') {
    return Response.json({ error: 'Run is not awaiting user input' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = FollowupBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  // Enforce constrained options: reject free-text answers that aren't in the allowed set
  const allowedOptions = runRecord.awaitingOptions
  if (allowedOptions && allowedOptions.length > 0) {
    const normalised = parsed.data.answer.trim().toLowerCase()
    const isAllowed = allowedOptions.some((opt) => opt.trim().toLowerCase() === normalised)
    if (!isAllowed) {
      return Response.json(
        { error: 'Answer must be one of the provided options', options: allowedOptions },
        { status: 422 },
      )
    }
  }

  const releaseLock = await acquireCaseLock(parsedId.value)

  try {
    const latestRun = await getRun(parsedRunId.value)
    if (!latestRun || latestRun.status !== 'awaiting_user') {
      return Response.json({ error: 'Run is not awaiting user input' }, { status: 409 })
    }

    const resumedRun = await updateRun(parsedRunId.value, { status: 'running' })
    const result = await runOrchestrator({
      caseRecord,
      runRecord: resumedRun,
      followupAnswer: parsed.data.answer,
      updateRun,
      writeDiagnosis,
      writeVerdict,
      writeActionPlan,
      writeHelperRequest,
      materializeReport: materializeCaseReport,
      insertEvent,
    })

    const responseBody: Record<string, unknown> = { status: result.status }
    if (result.question) responseBody.question = result.question
    return Response.json(responseBody)
  } catch (err) {
    logServerError('Follow-up orchestrator failed', err, {
      caseId: parsedId.value,
      runId: parsedRunId.value,
    })
    return internalServerError('Failed to process follow-up')
  } finally {
    releaseLock()
  }
}
