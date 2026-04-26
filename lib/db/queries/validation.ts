import { z } from 'zod'

const UuidSchema = z.string().uuid()

const CaseCategorySchema = z.enum(['electronics', 'clothing', 'furniture', 'misc', 'laptop', 'bicycle', 'scooter', 'mini_fridge'])
const UrgencySchema = z.enum(['low', 'normal', 'urgent'])
const CaseStatusSchema = z.enum(['draft', 'open', 'running', 'awaiting_user', 'complete', 'failed'])
const AgentPhaseSchema = z.enum([
  'intake',
  'diagnosis',
  'economics',
  'action_plan',
  'helper_routing',
  'orchestrator',
])
const RunStatusSchema = z.enum(['running', 'awaiting_user', 'complete', 'failed'])
const TriggerReasonSchema = z.enum(['initial', 'manual_retry', 'field_edit', 'new_info'])
const PhaseStatusSchema = z.enum(['started', 'running', 'complete', 'failed', 'awaiting_user'])
const VerdictLabelSchema = z.enum([
  'repair_now',
  'repair_if_cheap',
  'wait_monitor',
  'replace_soon',
  'replace_now',
])
const BreakdownSchema = z.object({
  diagnosisConfidence: z.number(),
  costFactor: z.number(),
  effortFactor: z.number(),
  partAvailability: z.number(),
  urgencyFactor: z.number(),
})

const ActionStepSchema = z.object({
  order: z.number(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  involvesDisassembly: z.boolean(),
  involvesElectricity: z.boolean(),
  involvesHeat: z.boolean(),
  involvesPressure: z.boolean(),
})

const TopCauseSchema = z.object({
  description: z.string(),
})

export const CaseRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  category: CaseCategorySchema,
  symptoms: z.string(),
  urgency: UrgencySchema,
  model_number: z.string().nullable().optional(),
  quoted_price_cents: z.number().int().nonnegative().nullable().optional(),
  status: CaseStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const RunRowSchema = z.object({
  id: z.string(),
  case_id: z.string(),
  is_current: z.boolean(),
  status: RunStatusSchema,
  current_phase: AgentPhaseSchema,
  next_phase: AgentPhaseSchema.nullable().optional(),
  awaiting_question: z.string().nullable().optional(),
  awaiting_options: z.array(z.string()).nullable().optional(),
  followup_count: z.number().int().nonnegative(),
  trigger_reason: TriggerReasonSchema,
  created_at: z.string(),
  updated_at: z.string(),
})

export const EventRowSchema = z.object({
  id: z.union([z.string(), z.number()]),
  case_id: z.string(),
  run_id: z.string(),
  phase: AgentPhaseSchema,
  status: PhaseStatusSchema,
  payload: z.unknown().nullable().optional(),
  created_at: z.string(),
})

export const DiagnosisRowSchema = z.object({
  top_causes: z.array(TopCauseSchema).nullable().optional(),
  confidence: z.number(),
  safety_flags: z.array(z.string()).nullable().optional(),
  technician_questions: z.array(z.string()).nullable().optional(),
})

export const VerdictRowSchema = z.object({
  rrr_score: z.number().nullable().optional(),
  label: VerdictLabelSchema,
  rrr_breakdown: BreakdownSchema,
  repair_low_cents: z.number().int().nonnegative().nullable().optional(),
  replacement_value_cents: z.number().int().nonnegative().nullable().optional(),
  uncertainty_note: z.string().nullable().optional(),
})

export const ActionPlanRowSchema = z.object({
  steps: z.array(ActionStepSchema),
  safety_preamble: z.string().nullable().optional(),
  technician_questions: z.array(z.string()).nullable().optional(),
})

export const HelperRequestRowSchema = z.object({
  matches: z.array(z.object({
    name: z.string(),
    contactUrl: z.string(),
    specialization: z.string(),
  })).nullable().optional(),
})

type SupabaseErrorLike = { message: string } | null

export function isUuid(value: string): boolean {
  return UuidSchema.safeParse(value).success
}

export function assertNoSupabaseError(error: SupabaseErrorLike, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

export function parseDbRow<T>(schema: z.ZodSchema<T>, row: unknown, context: string): T {
  const parsed = schema.safeParse(row)
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')
    throw new Error(`${context}: invalid row shape (${details})`)
  }
  return parsed.data
}

export function parseDbRows<T>(schema: z.ZodSchema<T>, rows: unknown[], context: string): T[] {
  return rows.map((row, index) => parseDbRow(schema, row, `${context}[${index}]`))
}
