import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type { IntakePayload } from '../types/payloads'
import { IntakePayloadSchema } from '../events/schemas'
import { buildClient } from './model-router'
import { mockIntake } from './mock-provider'
import { wrapUserInput } from './prompt-safety'

export async function runIntake(ctx: AgentContext, caseRecord: CaseRecord): Promise<IntakePayload> {
  const client = buildClient('flash')
  if (!client) return mockIntake(ctx, caseRecord)

  await ctx.emitEvent('intake', 'started')

  const prompt = `You are a repair intake specialist. Parse the following device symptoms into structured data.

Device: ${caseRecord.category}
Symptoms: ${wrapUserInput(caseRecord.symptoms)}
Urgency: ${caseRecord.urgency}
Model number: ${caseRecord.modelNumber ? wrapUserInput(caseRecord.modelNumber) : 'unknown'}
User-provided repair quote: ${caseRecord.quoteCents != null ? `$${(caseRecord.quoteCents / 100).toFixed(2)}` : 'none'}

Return a JSON object matching this schema:
{
  "symptoms": string[],        // list of individual symptoms parsed from the description
  "photoUrls": string[],       // always [] for now
  "inferredCategory": "${caseRecord.category}",
  "confidence": number         // 0.0-1.0 confidence in category inference
}`

  const { generateObject } = await import('ai')

  let result
  try {
    result = await generateObject({ model: client, prompt, schema: IntakePayloadSchema })
  } catch {
    // Retry with schema explicitly in prompt
    try {
      result = await generateObject({ model: client, prompt: prompt + '\n\nReturn ONLY valid JSON.', schema: IntakePayloadSchema })
    } catch (err) {
      await ctx.emitEvent('intake', 'failed')
      throw err
    }
  }

  const payload = result.object
  await ctx.emitEvent('intake', 'complete', payload)
  return payload
}
