import type { VerdictLabel } from './agents'

export interface IntakePayload {
  symptoms: string[]
  photoUrls: string[]
  inferredCategory: import('./agents').CaseCategory
  confidence: number
}

export interface DiagnosisCompletePayload {
  rootCause: string
  confidence: number
  safetyFlags: string[]
  technicianQuestions: string[]
  awaitingUser: false
}

export interface DiagnosisAwaitingUserPayload {
  question: string
  reason: string
  awaitingUser: true
}

export type DiagnosisPayload = DiagnosisCompletePayload | DiagnosisAwaitingUserPayload

export interface RrrBreakdown {
  diagnosisConfidence: number
  costFactor: number
  effortFactor: number
  partAvailability: number
  urgencyFactor: number
}

export interface EconomicsPayload {
  rrrScore: number
  label: VerdictLabel
  breakdown: RrrBreakdown
  repairCostCents: number
  replacementValueCents: number
  uncertaintyNote: string
}

export interface ActionStep {
  order: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  involvesDisassembly: boolean
  involvesElectricity: boolean
  involvesHeat: boolean
  involvesPressure: boolean
}

export interface ActionPlanPayload {
  steps: ActionStep[]
  safetyPreamble?: string
  technicianQuestions: string[]
}

export interface HelperMatch {
  name: string
  contactUrl: string
  specialization: string
}

export interface HelperRoutingPayload {
  matches: HelperMatch[]
}
