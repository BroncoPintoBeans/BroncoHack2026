import { describe, it, expect } from 'vitest'
import { createCase } from '../../lib/db/queries/cases'
import { createRun, getCurrentRun } from '../../lib/db/queries/runs'
import { getCurrentCaseOutput } from '../../lib/db/queries/current'
import { demoStore } from '../../lib/db/demo-store'

describe('db-queries', () => {
  it('createRun demotes prior current run', async () => {
    const caseRecord = await createCase({
      userId: 'test-user',
      category: 'laptop',
      symptoms: 'test symptoms',
      urgency: 'normal',
    })

    const runA = await createRun({ caseId: caseRecord.id, triggerReason: 'initial' })
    expect(runA.isCurrent).toBe(true)

    const runB = await createRun({ caseId: caseRecord.id, triggerReason: 'manual_retry' })
    expect(runB.isCurrent).toBe(true)
    expect(runB.id).not.toBe(runA.id)

    const current = await getCurrentRun(caseRecord.id)
    expect(current?.id).toBe(runB.id)

    // runA must be demoted
    const runAAfter = demoStore.runs.get(runA.id)
    expect(runAAfter?.isCurrent).toBe(false)
  })

  it('getCurrentCaseOutput returns diagnosis, verdict, action plan for seeded demo case', async () => {
    const output = await getCurrentCaseOutput('case-84920')
    expect(output).not.toBeNull()
    expect(output!.case.id).toBe('case-84920')
    expect(output!.diagnosis).toBeDefined()
    expect(output!.diagnosis?.rootCause).toContain('Thermal paste')
    expect(output!.verdict).toBeDefined()
    expect(output!.verdict?.label).toBe('repair_now')
    expect(output!.actionPlan).toBeDefined()
    expect(output!.actionPlan?.steps.length).toBeGreaterThan(0)
    expect(output!.events.length).toBe(8)
  })
})
