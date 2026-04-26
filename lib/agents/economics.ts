import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type { DiagnosisCompletePayload, EconomicsPayload } from '../types/payloads'
import { buildClient } from './model-router'
import { mockEconomics } from './mock-provider'
import { computeRrr } from '../utils/rrr'

export async function runEconomics(
  ctx: AgentContext,
  caseRecord: CaseRecord,
  diagnosisPayload: DiagnosisCompletePayload,
): Promise<EconomicsPayload> {
  const client = buildClient('flash')
  if (!client) return mockEconomics(ctx, { symptoms: [], photoUrls: [], inferredCategory: caseRecord.category, confidence: diagnosisPayload.confidence }, diagnosisPayload)

  const { generateObject } = await import('ai')
  const { z } = await import('zod')

  const EconInputSchema = z.object({
    repairCostCents: z.number().int().nonnegative(),
    replacementValueCents: z.number().int().positive(),
    effort: z.enum(['easy', 'medium', 'hard']),
    partAvailability: z.enum(['in_stock', 'special_order', 'scarce']),
    uncertaintyNote: z.string().min(1),
  })

  const prompt = `You are a repair economics analyst. Estimate repair vs replacement economics.

Device: ${caseRecord.category}
Root cause: ${diagnosisPayload.rootCause}
Diagnosis confidence: ${diagnosisPayload.confidence}
User urgency: ${caseRecord.urgency}

Return JSON:
{
  "repairCostCents": number,       // estimated repair cost in cents
  "replacementValueCents": number, // refurbished replacement value in cents
  "effort": "easy"|"medium"|"hard",
  "partAvailability": "in_stock"|"special_order"|"scarce",
  "uncertaintyNote": string        // non-empty note about cost uncertainty
}`

  let result
  try {
    result = await generateObject({ model: client, prompt, schema: EconInputSchema })
  } catch {
    try {
      result = await generateObject({ model: client, prompt: prompt + '\n\nReturn ONLY valid JSON.', schema: EconInputSchema })
    } catch (err) {
      await ctx.emitEvent('economics', 'failed')
      throw err
    }
  }

  const { repairCostCents, replacementValueCents, effort, partAvailability, uncertaintyNote } = result.object
  const { score, label, breakdown } = computeRrr({
    diagnosisConfidence: diagnosisPayload.confidence,
    repairCostCents,
    replacementValueCents,
    effort,
    partAvailability,
    urgency: caseRecord.urgency,
  })

  const payload: EconomicsPayload = {
    rrrScore: score,
    label,
    breakdown,
    repairCostCents,
    replacementValueCents,
    uncertaintyNote,
  }

  await ctx.emitEvent('economics', 'complete', payload)
  return payload
}
