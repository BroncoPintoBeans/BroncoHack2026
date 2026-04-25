import type { AgentPhase, PhaseStatus } from '../types/agents'

export interface CaseEvent {
  id: string
  case_id: string
  run_id: string
  phase: AgentPhase
  status: PhaseStatus
  payload?: unknown
  created_at: string
}
