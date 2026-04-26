import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type { DiagnosisCompletePayload, ActionPlanPayload } from '../types/payloads'
import { ActionPlanPayloadSchema } from '../events/schemas'
import { buildClient } from './model-router'
import { mockActionPlan } from './mock-provider'
import { applySafetyGuard } from '../utils/safety-guard'

export async function runActionPlan(
  ctx: AgentContext,
  caseRecord: CaseRecord,
  diagnosisPayload: DiagnosisCompletePayload,
): Promise<ActionPlanPayload> {
  let rawPayload: ActionPlanPayload

  const client = buildClient('flash')
  if (!client) {
    rawPayload = await mockActionPlan(ctx, diagnosisPayload)
  } else {
    await ctx.emitEvent('action_plan', 'started')

    const { generateObject } = await import('ai')

    const prompt = `You are a repair action planner. Create step-by-step repair instructions.

Device: ${caseRecord.category}
Root cause: ${diagnosisPayload.rootCause}
Technician questions: ${diagnosisPayload.technicianQuestions.join(', ')}

Return JSON:
{
  "steps": [{
    "order": number,
    "title": string,
    "description": string,
    "difficulty": "easy"|"medium"|"hard",
    "involvesDisassembly": boolean,
    "involvesElectricity": boolean,
    "involvesHeat": boolean,
    "involvesPressure": boolean
  }],
  "technicianQuestions": string[]
}`

    let result
    try {
      result = await generateObject({ model: client, prompt, schema: ActionPlanPayloadSchema })
    } catch {
      try {
        result = await generateObject({ model: client, prompt: prompt + '\n\nReturn ONLY valid JSON.', schema: ActionPlanPayloadSchema })
      } catch (err) {
        await ctx.emitEvent('action_plan', 'failed')
        throw err
      }
    }

    rawPayload = result.object
  }

  // Safety guard is ALWAYS called unconditionally — cannot be bypassed by prompt
  const safePayload = applySafetyGuard(rawPayload, diagnosisPayload.safetyFlags)

  if (client) {
    await ctx.emitEvent('action_plan', 'complete', safePayload)
  }
  return safePayload
}
