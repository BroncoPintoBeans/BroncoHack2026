import type { AgentPhase, ModelTier } from '../types/agents'

const PHASE_MODEL_MAP: Record<AgentPhase, ModelTier> = {
  intake: 'flash',
  diagnosis: 'pro',
  economics: 'flash',
  action_plan: 'flash',
  helper_routing: 'flash',
  orchestrator: 'flash',
}

export function modelFor(phase: AgentPhase): ModelTier {
  return PHASE_MODEL_MAP[phase]
}

const MODEL_IDS: Record<ModelTier, string> = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
}

export function buildClient(tier: ModelTier) {
  const apiKey = process.env.GOOGLE_API_KEY ?? (process.env.NODE_ENV === 'test' ? undefined : process.env.GEMINI_API_KEY)
  if (!apiKey) return null
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createGoogleGenerativeAI } = require('@ai-sdk/google')
  return createGoogleGenerativeAI({ apiKey })(MODEL_IDS[tier])
}
