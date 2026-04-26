import { describe, it, expect } from 'vitest'
import { POST as startRun } from '@/app/api/cases/[id]/run/route'
import { GET as getCurrent } from '@/app/api/cases/[id]/current/route'
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
})
