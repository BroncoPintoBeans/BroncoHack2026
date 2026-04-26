/**
 * E2E demo flow — exercises the full mock-provider pipeline in-process.
 *
 * No GOOGLE_API_KEY required: when the env var is absent, every agent
 * automatically falls back to the mock provider which returns deterministic
 * fixtures (rrrScore 0.78, label 'repair_now').
 *
 * Mirrors what the route handlers do:
 *   POST /api/cases           → createCase
 *   POST /api/cases/:id/run   → createRun + runOrchestrator
 *   GET  /api/cases/:id/current → getCurrentCaseOutput
 */

import { describe, it, expect } from 'vitest'
import { createCase } from '../../lib/db/queries/cases'
import { createRun, updateRun } from '../../lib/db/queries/runs'
import { writeDiagnosis, writeVerdict, writeActionPlan, writeHelperRequest } from '../../lib/db/queries/outputs'
import { insertEvent } from '../../lib/db/queries/events'
import { runOrchestrator } from '../../lib/agents/orchestrator'
import { getCurrentCaseOutput } from '../../lib/db/queries/current'

const DEMO_USER = 'demo-user-00000000-0000-0000-0000-000000000000'

describe('demo flow (mock provider, no API key)', () => {
  it('creates a laptop case, runs the full orchestrator pipeline, and returns a repair_now verdict', async () => {
    // Step 1: create case — mirrors POST /api/cases
    const caseRecord = await createCase({
      userId: DEMO_USER,
      category: 'laptop',
      symptoms: 'screen cracked and battery drains in under an hour',
      urgency: 'normal',
    })
    expect(caseRecord.id).toBeTruthy()
    expect(caseRecord.category).toBe('laptop')

    // Step 2: start a run — mirrors POST /api/cases/:id/run
    const runRecord = await createRun({ caseId: caseRecord.id, triggerReason: 'manual_retry' })
    const result = await runOrchestrator({
      caseRecord,
      runRecord,
      updateRun,
      writeDiagnosis,
      writeVerdict,
      writeActionPlan,
      writeHelperRequest,
      insertEvent,
    })

    expect(result.status).toBe('complete')

    // Step 3: get snapshot — mirrors GET /api/cases/:id/current
    const snapshot = await getCurrentCaseOutput(caseRecord.id)

    expect(snapshot).not.toBeNull()
    expect(snapshot!.currentRun?.status).toBe('complete')
    expect(snapshot!.verdict).toBeDefined()

    const { rrrScore, label } = snapshot!.verdict!
    // Mock economics always returns 0.78; acceptable range accounts for any
    // slight formula variation while confirming the repair_now threshold (≥0.70)
    expect(rrrScore).toBeGreaterThanOrEqual(0.70)
    expect(rrrScore).toBeLessThanOrEqual(0.85)
    expect(label).toBe('repair_now')
  })
})
