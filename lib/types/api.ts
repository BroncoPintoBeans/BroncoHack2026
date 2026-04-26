import type { CaseCategory, Urgency } from './agents'
import type { CaseRecord, CaseMediaRecord, CaseEventRecord, CurrentCaseOutput } from './case'
import type { HelperRequestDetail } from './community/helper-requests'

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

export interface CreateMediaRequest { file: File }
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

export interface PublishHelperRequestRequest {
  report_id: string
  title?: string
  public_summary?: string
  campus_area?: string
  preferred_time?: string
  skill_tags?: string[]
}
export interface PublishHelperRequestResponse {
  helper_request: HelperRequestDetail
  created: boolean
}
