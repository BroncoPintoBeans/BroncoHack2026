import { describe, it, expect } from 'vitest'
import { POST as postFollowup } from '@/app/api/cases/[id]/runs/[runId]/followup/route'
import { GET as getCurrent } from '@/app/api/cases/[id]/current/route'
import { POST as createCaseRoute } from '@/app/api/cases/route'
import { demoStore } from '@/lib/db/demo-store'
import type { CaseRunRecord } from '@/lib/types/case'
import type { NextRequest } from 'next/server'

// Route handlers accept NextRequest; Request is compatible at runtime.
function makeReq(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest
}

describe('POST /api/cases/[id]/runs/[runId]/followup', () => {
  it('returns 404 when the case does not exist', async () => {
    const req = makeReq('http://localhost/api/cases/bad-case/runs/bad-run/followup', {
      method: 'POST',
      body: JSON.stringify({ answer: 'Yes' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postFollowup(req, { params: Promise.resolve({ id: 'bad-case', runId: 'bad-run' }) })
    expect(res.status).toBe(404)
  })

  it('returns 404 when the run does not exist', async () => {
    const req = makeReq('http://localhost/api/cases/case-84920/runs/run-nonexistent/followup', {
      method: 'POST',
      body: JSON.stringify({ answer: 'Yes' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await postFollowup(req, {
      params: Promise.resolve({ id: 'case-84920', runId: 'run-nonexistent' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 409 when run status is complete, not awaiting_user', async () => {
    // The seeded demo run for case-84920 has status 'complete'
    const seededRunId = 'run-84920-01'
    const req = makeReq(
      `http://localhost/api/cases/case-84920/runs/${seededRunId}/followup`,
      {
        method: 'POST',
        body: JSON.stringify({ answer: 'Some answer' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const res = await postFollowup(req, {
      params: Promise.resolve({ id: 'case-84920', runId: seededRunId }),
    })
    expect(res.status).toBe(409)
  })

  it('resumes an awaiting_user run, completes, and GET current shows verdict', async () => {
    // Create a fresh case
    const createReq = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'laptop', symptoms: 'Screen flickers after 10 minutes' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const createRes = await createCaseRoute(createReq)
    expect(createRes.status).toBe(201)
    const { case: newCase } = await createRes.json()

    // Inject a run with awaiting_user status directly into the demoStore.
    // The mock provider never pauses on its own, so we seed the paused state manually.
    const runId = `run-awaiting-${Date.now()}`
    const awaitingRun: CaseRunRecord = {
      id: runId,
      caseId: newCase.id,
      isCurrent: true,
      status: 'awaiting_user',
      currentPhase: 'diagnosis',
      awaitingQuestion: 'Has the device been dropped recently?',
      followupCount: 0,
      triggerReason: 'initial',
      startedAt: new Date().toISOString(),
    }
    demoStore.runs.set(runId, awaitingRun)
    demoStore.runsByCaseId.set(newCase.id, runId)

    // POST followup answer → orchestrator resumes and completes
    const followupReq = makeReq(
      `http://localhost/api/cases/${newCase.id}/runs/${runId}/followup`,
      {
        method: 'POST',
        body: JSON.stringify({ answer: 'No, it was not dropped' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const followupRes = await postFollowup(followupReq, {
      params: Promise.resolve({ id: newCase.id, runId }),
    })
    expect(followupRes.status).toBe(200)
    const followupBody = await followupRes.json()
    expect(followupBody.status).toBe('complete')

    // GET current snapshot → verdict and actionPlan are present
    const currentReq = new Request(`http://localhost/api/cases/${newCase.id}/current`)
    const currentRes = await getCurrent(currentReq, {
      params: Promise.resolve({ id: newCase.id }),
    })
    expect(currentRes.status).toBe(200)
    const currentBody = await currentRes.json()
    expect(currentBody.snapshot.verdict).toBeDefined()
    expect(typeof currentBody.snapshot.verdict.rrrScore).toBe('number')
    expect(currentBody.snapshot.actionPlan).toBeDefined()
    expect(currentBody.snapshot.actionPlan.steps.length).toBeGreaterThan(0)
  })
})
