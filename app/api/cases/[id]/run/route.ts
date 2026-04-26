import type { NextRequest } from 'next/server'
import { isRequestUserOwner } from '@/lib/auth/demo-user'
import { internalServerError, logServerError, parseUuidParam } from '@/lib/api/route-helpers'
import { getCase } from '@/lib/db/queries/cases'
import { createRun, getCurrentRun, updateRun } from '@/lib/db/queries/runs'
import { acquireCaseLock } from '@/lib/db/locks'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { writeDiagnosis, writeVerdict, writeActionPlan, writeHelperRequest } from '@/lib/db/queries/outputs'
import { insertEvent } from '@/lib/db/queries/events'
import { createOrUpdateCaseReportForRun } from '@/lib/db/queries/reports'

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

  const releaseLock = await acquireCaseLock(parsedId.value)
  try {
    const activeRun = await getCurrentRun(parsedId.value)
    if (activeRun && (activeRun.status === 'running' || activeRun.status === 'awaiting_user')) {
      return Response.json({ error: 'A run is already active for this case' }, { status: 409 })
    }

    const runRecord = await createRun({
      caseId: parsedId.value,
      userId: caseRecord.userId,
      inputSnapshot: {
        category: caseRecord.category,
        symptoms: caseRecord.symptoms,
        urgency: caseRecord.urgency,
        modelNumber: caseRecord.modelNumber ?? null,
        quoteCents: caseRecord.quoteCents ?? null,
      },
      triggerReason: 'manual_retry',
    })

    const result = await runOrchestrator({
      caseRecord,
      runRecord,
      updateRun,
      writeDiagnosis,
      writeVerdict,
      writeActionPlan,
      writeHelperRequest,
      writeCaseReport: createOrUpdateCaseReportForRun,
      insertEvent,
    })

    const body: Record<string, unknown> = { status: result.status, runId: runRecord.id }
    if (result.question) body.question = result.question
    return Response.json(body)
  } catch (err) {
    logServerError('Run orchestrator failed', err, { caseId: parsedId.value })
    return internalServerError('Failed to start run')
  } finally {
    releaseLock()
  }
}
