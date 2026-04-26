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
  storagePath?: string
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
  /** Constrained answer choices the user must pick from (prevents free-text prompt injection) */
  awaitingOptions?: string[]
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

export interface CaseReportBoardSummary {
  title: string
  publicSummary: string
  helperRequestTemplate: string
  category: CaseCategory
  urgency: Urgency
  skillTags: string[]
  safetyFlags: string[]
  verdictLabel: string | null
  rrrScore: number | null
}

export interface CaseReportJson {
  version: 1
  generatedAt: string
  case: Pick<CaseRecord, 'id' | 'category' | 'symptoms' | 'urgency' | 'modelNumber' | 'quoteCents'>
  run: Pick<CaseRunRecord, 'id' | 'status' | 'currentPhase' | 'followupCount' | 'startedAt' | 'completedAt'>
  diagnosis: DiagnosisCompletePayload | null
  verdict: EconomicsPayload | null
  actionPlan: ActionPlanPayload | null
  helperRouting: { matches: HelperMatch[] }
  media: CaseMediaRecord[]
  followUps: { question: string; options: string[]; createdAt: string }[]
  imageAnnotations?: unknown[]
}

export interface CaseReportRecord {
  id: string
  caseId: string
  runId: string
  userId: string
  reportVersion: number
  reportJson: CaseReportJson
  boardSummaryJson: CaseReportBoardSummary
  createdAt: string
  updatedAt: string
}

export interface CurrentCaseOutput {
  case: CaseRecord
  currentRun?: CaseRunRecord
  media: CaseMediaRecord[]
  report?: CaseReportRecord
  diagnosis?: DiagnosisCompletePayload
  verdict?: EconomicsPayload
  actionPlan?: ActionPlanPayload
  helperMatches?: HelperMatch[]
  events: CaseEventRecord[]
}
