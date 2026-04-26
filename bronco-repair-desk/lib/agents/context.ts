import type { AgentPhase, PhaseStatus } from '../types/agents'
import type { CaseEventRecord } from '../types/case'

export interface AgentContext {
  caseId: string
  runId: string
  emitEvent(phase: AgentPhase, status: PhaseStatus, payload?: unknown): Promise<void>
}

export function createAgentContext(
  caseId: string,
  runId: string,
  insertEvent: (event: Omit<CaseEventRecord, 'id' | 'createdAt'>) => Promise<CaseEventRecord>,
): AgentContext {
  return {
    caseId,
    runId,
    async emitEvent(phase, status, payload?) {
      await insertEvent({ caseId, runId, phase, status, payload })
    },
  }
}
