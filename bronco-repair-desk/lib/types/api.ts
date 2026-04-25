import type { CaseCategory, Urgency } from './agents'
import type { CaseRecord, CaseMediaRecord, CaseEventRecord, CurrentCaseOutput } from './case'

export interface CreateCaseRequest {
  category: CaseCategory
  symptoms: string
  urgency: Urgency
  modelNumber?: string
  quoteCents?: number
}
export interface CreateCaseResponse { case: CaseRecord }

export interface ListCasesResponse { cases: CaseRecord[] }

export interface GetCaseResponse { case: CaseRecord }

export interface UpdateCaseRequest {
  symptoms?: string
  urgency?: Urgency
  modelNumber?: string
  quoteCents?: number
}
export interface UpdateCaseResponse { case: CaseRecord }

export interface CreateMediaRequest { url: string; mediaType: 'image' | 'video' }
export interface CreateMediaResponse { media: CaseMediaRecord }

export interface StartRunResponse {
  status: 'complete' | 'awaiting_user' | 'failed'
  runId: string
  question?: string
}

export interface FollowupRequest { answer: string }
export interface FollowupResponse { status: 'complete' | 'awaiting_user' | 'failed' }

export interface GetCurrentResponse { snapshot: CurrentCaseOutput }

export interface GetEventsResponse { events: CaseEventRecord[] }
