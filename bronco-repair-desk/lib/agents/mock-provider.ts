import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type {
  IntakePayload,
  DiagnosisCompletePayload,
  EconomicsPayload,
  ActionPlanPayload,
  HelperRoutingPayload,
} from '../types/payloads'

const MOCK_INTAKE: IntakePayload = {
  symptoms: ['Screen flickers and goes black after 10 minutes', 'Fan spins loudly'],
  photoUrls: [],
  inferredCategory: 'laptop',
  confidence: 0.95,
}

const MOCK_DIAGNOSIS: DiagnosisCompletePayload = {
  rootCause: 'Thermal paste degradation causing GPU throttling and display instability',
  confidence: 0.88,
  safetyFlags: [],
  technicianQuestions: ['Has the device been dropped recently?'],
  awaitingUser: false,
}

const MOCK_ECONOMICS: EconomicsPayload = {
  rrrScore: 0.78,
  label: 'repair_now',
  breakdown: {
    diagnosisConfidence: 0.88,
    costFactor: 0.82,
    effortFactor: 0.6,
    partAvailability: 1.0,
    urgencyFactor: 0.7,
  },
  repairCostCents: 4500,
  replacementValueCents: 55000,
  uncertaintyNote: 'Thermal paste cost varies by technician; DIY is feasible for intermediate users.',
}

const MOCK_ACTION_PLAN: ActionPlanPayload = {
  steps: [
    {
      order: 1,
      title: 'Power down and discharge',
      description: 'Shut down the MacBook fully. Hold the power button for 10 seconds to discharge residual power.',
      difficulty: 'easy',
      involvesDisassembly: false,
      involvesElectricity: false,
      involvesHeat: false,
      involvesPressure: false,
    },
    {
      order: 2,
      title: 'Remove bottom case screws',
      description: 'Use a P5 pentalobe screwdriver to remove the 6 screws from the bottom case.',
      difficulty: 'medium',
      involvesDisassembly: true,
      involvesElectricity: false,
      involvesHeat: false,
      involvesPressure: false,
    },
    {
      order: 3,
      title: 'Apply new thermal compound',
      description: 'Clean old thermal paste from CPU/GPU and heatsink with isopropyl alcohol. Apply a pea-sized amount of new thermal compound.',
      difficulty: 'medium',
      involvesDisassembly: true,
      involvesElectricity: false,
      involvesHeat: true,
      involvesPressure: false,
    },
  ],
  technicianQuestions: ['Has the device been dropped recently?'],
}

export async function mockIntake(ctx: AgentContext, _caseRecord: CaseRecord): Promise<IntakePayload> {
  await ctx.emitEvent('intake', 'started')
  await ctx.emitEvent('intake', 'complete', MOCK_INTAKE)
  return MOCK_INTAKE
}

export async function mockDiagnosis(
  ctx: AgentContext,
  _caseRecord: CaseRecord,
): Promise<DiagnosisCompletePayload> {
  await ctx.emitEvent('diagnosis', 'started')
  await ctx.emitEvent('diagnosis', 'complete', MOCK_DIAGNOSIS)
  return MOCK_DIAGNOSIS
}

export async function mockEconomics(
  ctx: AgentContext,
  _intakePayload: IntakePayload,
  _diagnosisPayload: DiagnosisCompletePayload,
): Promise<EconomicsPayload> {
  await ctx.emitEvent('economics', 'complete', MOCK_ECONOMICS)
  return MOCK_ECONOMICS
}

export async function mockActionPlan(
  ctx: AgentContext,
  _diagnosisPayload: DiagnosisCompletePayload,
): Promise<ActionPlanPayload> {
  await ctx.emitEvent('action_plan', 'complete', MOCK_ACTION_PLAN)
  return MOCK_ACTION_PLAN
}

export async function mockHelperRouting(ctx: AgentContext): Promise<HelperRoutingPayload> {
  const payload: HelperRoutingPayload = {
    matches: [
      { name: 'iFixit Community', contactUrl: 'https://ifixit.com', specialization: 'General electronics repair' },
      { name: 'uBreakiFix', contactUrl: 'https://ubreakifix.com', specialization: 'MacBook and laptop repair' },
    ],
  }
  await ctx.emitEvent('helper_routing', 'complete', payload)
  return payload
}
