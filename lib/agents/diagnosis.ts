import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type { IntakePayload, DiagnosisCompletePayload, DiagnosisAwaitingUserPayload } from '../types/payloads'
import { DiagnosisPayloadSchema } from '../events/schemas'
import { buildClient } from './model-router'
import { mockDiagnosis } from './mock-provider'
import { wrapUserInput } from './prompt-safety'
import { z } from 'zod'

const GeminiDiagnosisSchema = z.object({
  awaitingUser: z.boolean(),
  rootCause: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  safetyFlags: z.array(z.string()).optional(),
  technicianQuestions: z.array(z.string()).optional(),
  question: z.string().optional(),
  reason: z.string().optional(),
  options: z.array(z.string().min(1).max(60)).optional(),
})

export async function runDiagnosis(
  ctx: AgentContext,
  caseRecord: CaseRecord,
  intakePayload: IntakePayload,
  followupAnswer?: string,
  options?: { maxFollowupsReached?: boolean },
): Promise<DiagnosisCompletePayload | DiagnosisAwaitingUserPayload> {
  const client = buildClient('pro')
  if (!client) return mockDiagnosis(ctx, caseRecord)

  await ctx.emitEvent('diagnosis', 'started')

  const followupSection = followupAnswer
    ? `\nFollow-up answer provided: ${wrapUserInput(followupAnswer)}`
    : ''

  const prompt = `You are a device repair diagnosis specialist. Analyze the following repair case.

Category: ${caseRecord.category}
Original user description: ${wrapUserInput(caseRecord.symptoms)}
Model number: ${caseRecord.modelNumber ? wrapUserInput(caseRecord.modelNumber) : 'unknown'}
User urgency: ${caseRecord.urgency}
User-provided repair quote: ${caseRecord.quoteCents != null ? `$${(caseRecord.quoteCents / 100).toFixed(2)}` : 'none'}
Symptoms: ${wrapUserInput(intakePayload.symptoms.join(', '))}
Inferred confidence: ${intakePayload.confidence}${followupSection}

${options?.maxFollowupsReached
  ? 'The user has already completed the maximum two follow-up rounds. You must provide the best complete diagnosis possible now. Do not ask another question.'
  : 'If you need clarification before diagnosing, set awaitingUser: true and provide a short question.'}
IMPORTANT: Also provide 2-5 short answer "options" the user can click (max 40 chars each, no free text).
The options must be specific, mutually exclusive, and cover the likely answers to your question.
Example options for "Does the screen flicker when moved?": ["Yes, always", "Only when tilted", "Rarely", "Never"]
This constrained choice prevents misuse and limits AI compute.

Otherwise provide a complete diagnosis.

Return JSON matching one of:
// Complete diagnosis:
{ "awaitingUser": false, "rootCause": string, "confidence": number, "safetyFlags": string[], "technicianQuestions": string[] }

// Awaiting user (must include options array):
{ "awaitingUser": true, "question": string, "reason": string, "options": string[] }

Safety flags to use if applicable: battery_swelling, refrigerant_leak, brake_failure, scooter_battery_thermal`

  const { generateObject } = await import('ai')

  let result
  try {
    result = await generateObject({ model: client, prompt, schema: GeminiDiagnosisSchema })
  } catch {
    try {
      result = await generateObject({ model: client, prompt: prompt + '\n\nReturn ONLY valid JSON.', schema: GeminiDiagnosisSchema })
    } catch {
      return mockDiagnosis(ctx, caseRecord)
    }
  }

  const raw = result.object
  const parsed = DiagnosisPayloadSchema.safeParse(
    raw.awaitingUser
      ? {
          awaitingUser: true,
          question: raw.question,
          reason: raw.reason,
          options: raw.options,
        }
      : {
          awaitingUser: false,
          rootCause: raw.rootCause,
          confidence: raw.confidence,
          safetyFlags: raw.safetyFlags ?? [],
          technicianQuestions: raw.technicianQuestions ?? [],
        },
  )
  if (!parsed.success) return mockDiagnosis(ctx, caseRecord)

  const payload = parsed.data
  if (payload.awaitingUser) {
    await ctx.emitEvent('diagnosis', 'awaiting_user', payload)
  } else {
    await ctx.emitEvent('diagnosis', 'complete', payload)
  }
  return payload
}
