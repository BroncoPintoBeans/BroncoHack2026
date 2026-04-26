import type { CaseCategory, AgentPhase, PhaseStatus, Urgency } from './agents'
import type { DiagnosisCompletePayload, EconomicsPayload, ActionPlanPayload, HelperMatch } from './payloads'

export interface CaseRecord {
  id: string
  userId: string
  category: CaseCategory
  symptoms: string
  urgency: Urgency
  modelNumber?: string
  quoteCents?: number
  status: 'open' | 'running' | 'awaiting_user' | 'complete' | 'failed'
  createdAt: string
  updatedAt: string
}

export interface CaseMediaRecord {
  id: string
  caseId: string
  url: string
  mediaType: 'image' | 'video'
  createdAt: string
}

export interface CaseRunRecord {
  id: string
  caseId: string
  isCurrent: boolean
  status: 'running' | 'awaiting_user' | 'complete' | 'failed'
  currentPhase: AgentPhase
  nextPhase?: AgentPhase
  awaitingQuestion?: string
  followupCount: number
  triggerReason: 'initial' | 'manual_retry' | 'field_edit' | 'new_info'
  startedAt: string
  completedAt?: string
}

export interface CaseEventRecord {
  id: string
  caseId: string
  runId: string
  phase: AgentPhase
  status: PhaseStatus
  payload?: unknown
  createdAt: string
}

export interface CurrentCaseOutput {
  case: CaseRecord
  currentRun?: CaseRunRecord
  diagnosis?: DiagnosisCompletePayload
  verdict?: EconomicsPayload
  actionPlan?: ActionPlanPayload
  helperMatches?: HelperMatch[]
  events: CaseEventRecord[]
}
