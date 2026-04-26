/**
 * E2E followup flow — tests the awaiting_user → resume path.
 *
 * Because the mock provider always returns awaitingUser: false, we set the
 * run state to 'awaiting_user' directly via updateRun (the same call the
 * orchestrator makes internally), then call the orchestrator again with a
 * followupAnswer — exactly what POST /api/cases/:id/runs/:runId/followup does.
 */

import { describe, it, expect } from 'vitest'
import { createCase } from '../../lib/db/queries/cases'
import { createRun, updateRun } from '../../lib/db/queries/runs'
import { writeDiagnosis, writeVerdict, writeActionPlan, writeHelperRequest } from '../../lib/db/queries/outputs'
import { insertEvent } from '../../lib/db/queries/events'
import { runOrchestrator } from '../../lib/agents/orchestrator'
import { getCurrentCaseOutput } from '../../lib/db/queries/current'

const DEMO_USER = 'demo-user-00000000-0000-0000-0000-000000000000'

describe('followup flow (awaiting_user → resume)', () => {
  it('resumes a paused run with a user answer and produces a complete verdict', async () => {
    // 1. Create the case
    const caseRecord = await createCase({
      userId: DEMO_USER,
      category: 'laptop',
      symptoms: 'fan is loud and device overheats during normal use',
      urgency: 'normal',
    })

    // 2. Create a run and pause it (simulating the orchestrator reaching awaiting_user)
    const runRecord = await createRun({ caseId: caseRecord.id, triggerReason: 'initial' })
    const pausedRun = await updateRun(runRecord.id, {
      status: 'awaiting_user',
      awaitingQuestion: 'Has the device been dropped recently?',
    })
    expect(pausedRun.status).toBe('awaiting_user')
    expect(pausedRun.awaitingQuestion).toBe('Has the device been dropped recently?')

    // 3. Resume — mirrors POST /api/cases/:id/runs/:runId/followup:
    //    route sets status→running, then calls runOrchestrator with followupAnswer
    const resumedRun = await updateRun(runRecord.id, { status: 'running' })
    const result = await runOrchestrator({
      caseRecord,
      runRecord: resumedRun,
      followupAnswer: 'No, it has never been dropped.',
      updateRun,
      writeDiagnosis,
      writeVerdict,
      writeActionPlan,
      writeHelperRequest,
      insertEvent,
    })

    // 4. Verify the run completed and a verdict was written
    expect(result.status).toBe('complete')

    const snapshot = await getCurrentCaseOutput(caseRecord.id)
    expect(snapshot).not.toBeNull()
    expect(snapshot!.verdict).toBeDefined()
    expect(snapshot!.currentRun?.status).toBe('complete')
  })
})
