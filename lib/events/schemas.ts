import { z } from 'zod'

export const CaseCategorySchema = z.enum(['electronics', 'clothing', 'furniture', 'misc', 'laptop', 'bicycle', 'scooter', 'mini_fridge'])
export const AgentPhaseSchema = z.enum(['intake', 'diagnosis', 'economics', 'action_plan', 'helper_routing', 'orchestrator'])
export const PhaseStatusSchema = z.enum(['started', 'complete', 'failed', 'awaiting_user'])
export const VerdictLabelSchema = z.enum(['repair_now', 'repair_if_cheap', 'wait_monitor', 'replace_soon', 'replace_now'])
export const UrgencySchema = z.enum(['low', 'normal', 'urgent'])

export const IntakePayloadSchema = z.object({
  symptoms: z.array(z.string()),
  photoUrls: z.array(z.string()),
  inferredCategory: CaseCategorySchema,
  confidence: z.number().min(0).max(1),
})

export const DiagnosisCompletePayloadSchema = z.object({
  rootCause: z.string().min(1),
  confidence: z.number().min(0).max(1),
  safetyFlags: z.array(z.string()),
  technicianQuestions: z.array(z.string()),
  awaitingUser: z.literal(false),
})

export const DiagnosisAwaitingUserPayloadSchema = z.object({
  question: z.string().min(1),
  reason: z.string().min(1),
  awaitingUser: z.literal(true),
  options: z.array(z.string().min(1).max(60)).min(2).max(5),
})

export const DiagnosisPayloadSchema = z.discriminatedUnion('awaitingUser', [
  DiagnosisCompletePayloadSchema,
  DiagnosisAwaitingUserPayloadSchema,
])

export const RrrBreakdownSchema = z.object({
  diagnosisConfidence: z.number().min(0).max(1),
  costFactor: z.number().min(0).max(1),
  effortFactor: z.number().min(0).max(1),
  partAvailability: z.number().min(0).max(1),
  urgencyFactor: z.number().min(0).max(1),
})

export const EconomicsPayloadSchema = z.object({
  rrrScore: z.number().min(0).max(1),
  label: VerdictLabelSchema,
  breakdown: RrrBreakdownSchema,
  repairCostCents: z.number().int().nonnegative(),
  replacementValueCents: z.number().int().positive(),
  uncertaintyNote: z.string().min(1),
})

export const ActionStepSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  involvesDisassembly: z.boolean(),
  involvesElectricity: z.boolean(),
  involvesHeat: z.boolean(),
  involvesPressure: z.boolean(),
})

export const ActionPlanPayloadSchema = z.object({
  steps: z.array(ActionStepSchema),
  safetyPreamble: z.string().optional(),
  technicianQuestions: z.array(z.string()),
})

export const HelperMatchSchema = z.object({
  name: z.string().min(1),
  contactUrl: z.string().min(1),
  specialization: z.string().min(1),
})

export const HelperRoutingPayloadSchema = z.object({
  matches: z.array(HelperMatchSchema),
})

export const CaseEventSchema = z.object({
  id: z.string().min(1),
  case_id: z.string().min(1),
  run_id: z.string().min(1),
  phase: AgentPhaseSchema,
  status: PhaseStatusSchema,
  payload: z.unknown().optional(),
  created_at: z.string().min(1),
})

export const CreateCaseSchema = z.object({
  category: CaseCategorySchema,
  symptoms: z.string().min(1),
  urgency: UrgencySchema,
  modelNumber: z.string().optional(),
  quoteCents: z.number().int().nonnegative().optional(),
})
