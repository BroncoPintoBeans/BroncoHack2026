import { describe, it, expect } from 'vitest'
import { POST as startRun } from '@/app/api/cases/[id]/run/route'
import { GET as getCurrent } from '@/app/api/cases/[id]/current/route'
import { POST as publishHelperRequest } from '@/app/api/cases/[id]/helper-request/route'
import { POST as createCaseRoute } from '@/app/api/cases/route'
import { POST as createMediaRoute } from '@/app/api/cases/[id]/media/route'
import type { NextRequest } from 'next/server'

// Route handlers accept NextRequest, but Request is compatible at runtime
// since NextRequest extends Request and no Next.js-specific APIs are used.
function makeReq(url: string, init?: RequestInit): NextRequest {
  return new Request(url, init) as unknown as NextRequest
}

describe('POST /api/cases/[id]/run', () => {
  it('runs orchestrator on case-84920 with mock provider and returns status complete', async () => {
    const req = makeReq('http://localhost/api/cases/case-84920/run', { method: 'POST' })
    const res = await startRun(req, { params: Promise.resolve({ id: 'case-84920' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('complete')
    expect(body.runId).toBeTruthy()
  })

  it('returns 404 when case does not exist', async () => {
    const req = makeReq('http://localhost/api/cases/case-nope/run', { method: 'POST' })
    const res = await startRun(req, { params: Promise.resolve({ id: 'case-nope' }) })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/cases/[id]/current', () => {
  it('returns complete snapshot with verdict and actionPlan after run completes', async () => {
    // Ensure a run has completed for case-84920
    const runReq = makeReq('http://localhost/api/cases/case-84920/run', { method: 'POST' })
    const runRes = await startRun(runReq, { params: Promise.resolve({ id: 'case-84920' }) })
    expect(runRes.status).toBe(200)

    const req = new Request('http://localhost/api/cases/case-84920/current')
    const res = await getCurrent(req, { params: Promise.resolve({ id: 'case-84920' }) })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.snapshot).toBeDefined()
    expect(body.snapshot.verdict).toBeDefined()
    expect(typeof body.snapshot.verdict.rrrScore).toBe('number')
    expect(body.snapshot.verdict.label).toBe('repair_now')
    expect(body.snapshot.actionPlan).toBeDefined()
    expect(Array.isArray(body.snapshot.actionPlan.steps)).toBe(true)
    expect(body.snapshot.actionPlan.steps.length).toBeGreaterThan(0)
  })

  it('returns 404 for a non-existent case', async () => {
    const req = new Request('http://localhost/api/cases/case-ghost/current')
    const res = await getCurrent(req, { params: Promise.resolve({ id: 'case-ghost' }) })
    expect(res.status).toBe(404)
  })

  it('returns current run info in snapshot', async () => {
    const req = new Request('http://localhost/api/cases/case-84920/current')
    const res = await getCurrent(req, { params: Promise.resolve({ id: 'case-84920' }) })
    const body = await res.json()
    // The seeded demo run is already complete
    expect(body.snapshot.currentRun).toBeDefined()
    expect(body.snapshot.currentRun?.status).toBe('complete')
  })

  it('materializes one canonical case report and returns it from current', async () => {
    const createReq = makeReq('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({
        category: 'laptop',
        symptoms: 'Trackpad clicks randomly after a coffee spill',
        urgency: 'normal',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const createRes = await createCaseRoute(createReq)
    expect(createRes.status).toBe(201)
    const { case: createdCase } = await createRes.json()

    const runReq = makeReq(`http://localhost/api/cases/${createdCase.id}/run`, { method: 'POST' })
    const runRes = await startRun(runReq, { params: Promise.resolve({ id: createdCase.id }) })
    expect(runRes.status).toBe(200)
    const runBody = await runRes.json()

    const firstCurrent = await getCurrent(
      new Request(`http://localhost/api/cases/${createdCase.id}/current`),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    expect(firstCurrent.status).toBe(200)
    const firstBody = await firstCurrent.json()
    expect(firstBody.snapshot.report).toBeDefined()
    expect(firstBody.snapshot.report.runId).toBe(runBody.runId)
    expect(firstBody.snapshot.report.reportJson.diagnosis.rootCause).toContain('Thermal paste')
    expect(firstBody.snapshot.report.boardSummaryJson.verdictLabel).toBe('repair_now')

    const secondRunRes = await startRun(runReq, { params: Promise.resolve({ id: createdCase.id }) })
    expect(secondRunRes.status).toBe(200)
    const secondCurrent = await getCurrent(
      new Request(`http://localhost/api/cases/${createdCase.id}/current`),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    const secondBody = await secondCurrent.json()
    expect(secondBody.snapshot.report.id).not.toBe(firstBody.snapshot.report.id)
    expect(secondBody.snapshot.report.runId).toBe((await secondRunRes.json()).runId)
  })

  it('stores uploaded media and exposes it in current snapshots', async () => {
    const createReq = makeReq('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({
        category: 'bicycle',
        symptoms: 'Brake lever feels loose and the front brake squeals',
        urgency: 'urgent',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const createRes = await createCaseRoute(createReq)
    const { case: createdCase } = await createRes.json()

    const formData = new FormData()
    formData.set('file', new File(['fake image bytes'], 'brake.jpg', { type: 'image/jpeg' }))
    const mediaRes = await createMediaRoute(
      makeReq(`http://localhost/api/cases/${createdCase.id}/media`, {
        method: 'POST',
        body: formData,
      }),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    expect(mediaRes.status).toBe(201)
    const mediaBody = await mediaRes.json()
    expect(mediaBody.media.url).toMatch(/^data:image\/jpeg;base64,/)

    const currentRes = await getCurrent(
      new Request(`http://localhost/api/cases/${createdCase.id}/current`),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    const currentBody = await currentRes.json()
    expect(currentBody.snapshot.media).toHaveLength(1)
    expect(currentBody.snapshot.media[0].url).toBe(mediaBody.media.url)
  })

  it('requires a completed matching report before publishing a community helper card', async () => {
    const createReq = makeReq('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({
        category: 'mini_fridge',
        symptoms: 'Mini fridge hums but does not cool',
        urgency: 'normal',
      }),
      headers: { 'Content-Type': 'application/json' },
    })
    const createRes = await createCaseRoute(createReq)
    const { case: createdCase } = await createRes.json()

    const missingReportRes = await publishHelperRequest(
      makeReq(`http://localhost/api/cases/${createdCase.id}/helper-request`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Need fridge help' }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    expect(missingReportRes.status).toBe(422)

    await startRun(makeReq(`http://localhost/api/cases/${createdCase.id}/run`, { method: 'POST' }), {
      params: Promise.resolve({ id: createdCase.id }),
    })
    const currentRes = await getCurrent(
      new Request(`http://localhost/api/cases/${createdCase.id}/current`),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    const currentBody = await currentRes.json()
    const reportId = currentBody.snapshot.report.id

    const publishRes = await publishHelperRequest(
      makeReq(`http://localhost/api/cases/${createdCase.id}/helper-request`, {
        method: 'POST',
        body: JSON.stringify({
          report_id: reportId,
          title: 'Need mini fridge cooling help',
          public_summary: 'The fridge hums but will not cool. Looking for someone comfortable checking coils and basic electrical symptoms.',
          campus_area: 'Engineering Meadow',
          preferred_time: 'Friday afternoon',
          skill_tags: ['mini-fridge', 'diagnosis'],
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
      { params: Promise.resolve({ id: createdCase.id }) },
    )
    expect(publishRes.status).toBe(201)
    const publishBody = await publishRes.json()
    expect(publishBody.helper_request.report_id).toBe(reportId)
    expect(publishBody.helper_request.verdict_label).toBe('repair_now')
    expect(publishBody.helper_request.rrr_score).toBeGreaterThan(0)
    expect(publishBody.helper_request.diagnosis_snapshot).toEqual({})
  })
})
