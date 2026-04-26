import type { CaseRecord, CaseRunRecord, CaseEventRecord } from '../types/case'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperRoutingPayload } from '../types/payloads'
import { createAgentContext } from './context'
import { runIntake } from './intake'
import { runDiagnosis } from './diagnosis'
import { runEconomics } from './economics'
import { runActionPlan } from './action-plan'
import { runHelperRouting } from './helper-routing'

export interface OrchestratorDeps {
  updateRun(runId: string, data: Partial<Pick<CaseRunRecord, 'status' | 'currentPhase' | 'nextPhase' | 'awaitingQuestion' | 'awaitingOptions' | 'followupCount'>>): Promise<CaseRunRecord>
  writeDiagnosis(caseId: string, runId: string, payload: DiagnosisCompletePayload): Promise<void>
  writeVerdict(caseId: string, runId: string, payload: EconomicsPayload): Promise<void>
  writeActionPlan(caseId: string, runId: string, payload: ActionPlanPayload): Promise<void>
  writeHelperRequest(caseId: string, runId: string, payload: HelperRoutingPayload): Promise<void>
  writeCaseReport(caseId: string, runId: string): Promise<unknown>
  insertEvent(event: Omit<CaseEventRecord, 'id' | 'createdAt'>): Promise<CaseEventRecord>
}

export interface OrchestratorInput extends OrchestratorDeps {
  caseRecord: CaseRecord
  runRecord: CaseRunRecord
  followupAnswer?: string
}

export interface OrchestratorResult {
  status: 'complete' | 'failed' | 'awaiting_user'
  question?: string
}

export async function runOrchestrator(input: OrchestratorInput): Promise<OrchestratorResult> {
  const { caseRecord, runRecord, followupAnswer } = input
  const { caseId, runId } = { caseId: caseRecord.id, runId: runRecord.id }

  const ctx = createAgentContext(caseId, runId, input.insertEvent)

  try {
    await ctx.emitEvent('orchestrator', 'started')

    // Intake
    const intakePayload = await runIntake(ctx, caseRecord)

    // Diagnosis (may pause for user input)
    let diagnosisResult = await runDiagnosis(ctx, caseRecord, intakePayload, followupAnswer, {
      maxFollowupsReached: runRecord.followupCount >= 2,
    })

    if (diagnosisResult.awaitingUser && runRecord.followupCount >= 2) {
      diagnosisResult = {
        rootCause: `Best-effort diagnosis based on available evidence: ${caseRecord.symptoms}`,
        confidence: 0.45,
        safetyFlags: [],
        technicianQuestions: [
          'Diagnosis was completed after the maximum two follow-up rounds.',
        ],
        awaitingUser: false,
      }
      await ctx.emitEvent('diagnosis', 'complete', diagnosisResult)
    }

    if (diagnosisResult.awaitingUser) {
      await input.updateRun(runId, {
        status: 'awaiting_user',
        awaitingQuestion: diagnosisResult.question,
        awaitingOptions: diagnosisResult.options,
      })
      return { status: 'awaiting_user', question: diagnosisResult.question }
    }

    const diagnosisPayload = diagnosisResult as DiagnosisCompletePayload

    // Economics
    const economicsPayload = await runEconomics(ctx, caseRecord, diagnosisPayload)
    await input.writeVerdict(caseId, runId, economicsPayload)

    // Action Plan (safety guard applied inside)
    const actionPlanPayload = await runActionPlan(ctx, caseRecord, diagnosisPayload)
    await input.writeActionPlan(caseId, runId, actionPlanPayload)

    // Helper Routing
    const helperPayload = await runHelperRouting(ctx, caseRecord)
    await input.writeHelperRequest(caseId, runId, helperPayload)

    // Write diagnosis last (after economics has written verdict)
    await input.writeDiagnosis(caseId, runId, diagnosisPayload)

    await input.updateRun(runId, { status: 'complete', currentPhase: 'orchestrator' })
    await input.writeCaseReport(caseId, runId)
    await ctx.emitEvent('orchestrator', 'complete')

    return { status: 'complete' }
  } catch (err) {
    await ctx.emitEvent('orchestrator', 'failed')
    try {
      await input.updateRun(runId, { status: 'failed' })
    } catch {
      // best-effort
    }
    throw err
  }
}
