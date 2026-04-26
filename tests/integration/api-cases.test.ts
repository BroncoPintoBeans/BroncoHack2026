import { describe, it, expect } from 'vitest'
import { GET, POST } from '@/app/api/cases/route'
import { PATCH } from '@/app/api/cases/[id]/route'
import { demoStore } from '@/lib/db/demo-store'
import type { CaseRecord, CaseRunRecord } from '@/lib/types/case'

describe('POST /api/cases', () => {
  it('creates a case and returns 201 with id', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'laptop', symptoms: 'Screen black after boot' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.case).toBeDefined()
    expect(body.case.id).toBeTruthy()
    expect(body.case.category).toBe('laptop')
    expect(body.case.symptoms).toBe('Screen black after boot')
  })

  it('returns 422 for missing required fields', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'laptop' }), // missing symptoms
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(422)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/cases', () => {
  it('returns 200 with an array that includes newly created case', async () => {
    const postReq = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'bicycle', symptoms: 'Chain slips under load' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const postRes = await POST(postReq)
    const { case: created } = await postRes.json()

    const getRes = await GET()
    expect(getRes.status).toBe(200)
    const body = await getRes.json()
    expect(Array.isArray(body.cases)).toBe(true)
    const found = (body.cases as CaseRecord[]).find(c => c.id === created.id)
    expect(found).toBeDefined()
    expect(found?.category).toBe('bicycle')
  })

  it('returns the seeded demo cases', async () => {
    const getRes = await GET()
    const body = await getRes.json()
    const ids = (body.cases as CaseRecord[]).map(c => c.id)
    expect(ids).toContain('case-84920')
  })
})

describe('PATCH /api/cases/[id]', () => {
  it('updates case symptoms and returns 200', async () => {
    const postReq = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'mini_fridge', symptoms: 'Original symptoms' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const postRes = await POST(postReq)
    const { case: created } = await postRes.json()

    const patchReq = new Request(`http://localhost/api/cases/${created.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ symptoms: 'Updated symptoms after inspection' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) })
    expect(patchRes.status).toBe(200)
    const body = await patchRes.json()
    expect(body.case.symptoms).toBe('Updated symptoms after inspection')
  })

  it('returns 404 for non-existent case', async () => {
    const patchReq = new Request('http://localhost/api/cases/case-does-not-exist', {
      method: 'PATCH',
      body: JSON.stringify({ symptoms: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: 'case-does-not-exist' }) })
    expect(patchRes.status).toBe(404)
  })

  it('returns 409 when an active run exists for the case', async () => {
    const postReq = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: JSON.stringify({ category: 'scooter', symptoms: 'Battery drains fast' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const postRes = await POST(postReq)
    const { case: created } = await postRes.json()

    // Inject a running run directly into demoStore
    const runId = `run-active-409-${Date.now()}`
    const activeRun: CaseRunRecord = {
      id: runId,
      caseId: created.id,
      isCurrent: true,
      status: 'running',
      currentPhase: 'intake',
      followupCount: 0,
      triggerReason: 'initial',
      startedAt: new Date().toISOString(),
    }
    demoStore.runs.set(runId, activeRun)
    demoStore.runsByCaseId.set(created.id, runId)

    try {
      const patchReq = new Request(`http://localhost/api/cases/${created.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ symptoms: 'Changed symptoms' }),
        headers: { 'Content-Type': 'application/json' },
      })
      const patchRes = await PATCH(patchReq, { params: Promise.resolve({ id: created.id }) })
      expect(patchRes.status).toBe(409)
    } finally {
      demoStore.runs.delete(runId)
      demoStore.runsByCaseId.delete(created.id)
    }
  })
})
