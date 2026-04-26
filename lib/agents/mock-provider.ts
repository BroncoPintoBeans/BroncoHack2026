import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type {
  IntakePayload,
  DiagnosisCompletePayload,
  EconomicsPayload,
  ActionPlanPayload,
  HelperRoutingPayload,
} from '../types/payloads'
import { computeRrr } from '../utils/rrr'

function symptomList(symptoms: string): string[] {
  return symptoms
    .split(/[.;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function includesAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase()
  return words.some((word) => lower.includes(word))
}

function diagnose(caseRecord: CaseRecord): DiagnosisCompletePayload {
  const symptoms = caseRecord.symptoms.toLowerCase()
  const safetyFlags: string[] = []
  let rootCause = 'A repairable fault is likely, but the exact component should be confirmed with hands-on inspection'
  let confidence = 0.62
  let technicianQuestions = ['When did the issue first appear?', 'Does the symptom happen every time?']

  if (caseRecord.category === 'laptop') {
    if (includesAny(symptoms, ['swollen', 'bulge', 'puffy', 'battery'])) {
      rootCause = 'Possible battery degradation or swelling affecting laptop power and enclosure safety'
      safetyFlags.push('battery_swelling')
      confidence = 0.78
      technicianQuestions = ['Is the trackpad or case bulging?', 'Does it heat up while charging?']
    } else if (includesAny(symptoms, ['coffee', 'spill', 'liquid', 'water'])) {
      rootCause = 'Likely liquid contamination affecting the keyboard, trackpad, or nearby internal connectors'
      confidence = 0.76
      technicianQuestions = ['Was the device powered off immediately?', 'Do any keys or ports behave oddly?']
    } else if (includesAny(symptoms, ['fan', 'hot', 'overheat', 'slow']) && includesAny(symptoms, ['screen', 'display', 'flicker', 'black'])) {
      rootCause = 'Thermal paste degradation or blocked cooling path causing overheating and display instability'
      confidence = 0.82
      technicianQuestions = ['Does the fan run loudly?', 'Does the screen fail only after the laptop warms up?']
    } else if (includesAny(symptoms, ['screen', 'display', 'flicker', 'black'])) {
      rootCause = 'Likely display cable, panel, or hinge-area connection issue based on the screen symptoms'
      confidence = 0.74
      technicianQuestions = ['Does the display change when the lid angle moves?', 'Does an external monitor work?']
    } else if (includesAny(symptoms, ['fan', 'hot', 'overheat', 'slow'])) {
      rootCause = 'Likely thermal buildup, fan blockage, or degraded cooling performance'
      confidence = 0.7
      technicianQuestions = ['Does the fan run loudly?', 'Does performance drop after a few minutes?']
    }
  } else if (caseRecord.category === 'bicycle') {
    if (includesAny(symptoms, ['brake', 'stop', 'squeal'])) {
      rootCause = 'Brake pad wear, cable stretch, or rotor/rim contamination is likely'
      safetyFlags.push('brake_failure')
      confidence = 0.78
      technicianQuestions = ['Do both brakes engage firmly?', 'Are pads visibly worn or glazed?']
    } else if (includesAny(symptoms, ['chain', 'gear', 'shift', 'slip'])) {
      rootCause = 'Likely drivetrain wear or derailleur/cable adjustment issue'
      confidence = 0.76
      technicianQuestions = ['Does it skip under load?', 'Which gears are affected?']
    } else if (includesAny(symptoms, ['flat', 'tire', 'tube'])) {
      rootCause = 'Likely punctured tube, tire bead issue, or embedded debris'
      confidence = 0.82
      technicianQuestions = ['Does the tire lose air immediately?', 'Can you see debris in the tread?']
    }
  } else if (caseRecord.category === 'scooter') {
    if (includesAny(symptoms, ['battery', 'charge', 'range', 'power'])) {
      rootCause = 'Likely battery pack, charger, or controller power-delivery issue'
      safetyFlags.push('scooter_battery_thermal')
      confidence = 0.73
      technicianQuestions = ['Does it charge to 100%?', 'Does power cut out under acceleration?']
    } else if (includesAny(symptoms, ['brake', 'stop'])) {
      rootCause = 'Likely brake cable, pad, or electronic brake sensor issue'
      safetyFlags.push('brake_failure')
      confidence = 0.72
      technicianQuestions = ['Does the brake lever feel loose?', 'Do the wheels drag when released?']
    } else if (includesAny(symptoms, ['throttle', 'accelerate', 'motor'])) {
      rootCause = 'Likely throttle, controller, wiring, or motor connection issue'
      confidence = 0.68
      technicianQuestions = ['Does the display show an error code?', 'Does the motor ever engage?']
    }
  } else if (caseRecord.category === 'mini_fridge') {
    if (includesAny(symptoms, ['leak', 'chemical', 'hissing', 'refrigerant'])) {
      rootCause = 'Possible refrigerant leak or sealed-system failure requiring professional handling'
      safetyFlags.push('refrigerant_leak')
      confidence = 0.77
      technicianQuestions = ['Do you hear hissing?', 'Is there oily residue near the coils?']
    } else if (includesAny(symptoms, ['cool', 'cold', 'warm', 'compressor'])) {
      rootCause = 'Likely dirty condenser coils, thermostat fault, start relay issue, or compressor problem'
      confidence = 0.7
      technicianQuestions = ['Does the compressor hum or click?', 'Are the coils dusty or blocked?']
    }
  }

  return { rootCause, confidence, safetyFlags, technicianQuestions, awaitingUser: false }
}

const REPLACEMENT_VALUE_CENTS: Record<CaseRecord['category'], number> = {
  electronics: 45000,
  clothing: 8000,
  furniture: 22000,
  misc: 15000,
  laptop: 65000,
  bicycle: 25000,
  scooter: 42000,
  mini_fridge: 18000,
}

function estimateRepairCost(caseRecord: CaseRecord, diagnosis: DiagnosisCompletePayload): number {
  if (caseRecord.quoteCents != null) return caseRecord.quoteCents

  const rootCause = diagnosis.rootCause.toLowerCase()
  if (caseRecord.category === 'mini_fridge' && !diagnosis.safetyFlags.includes('refrigerant_leak')) return 4500
  if (includesAny(rootCause, ['thermal paste', 'blocked cooling', 'cooling path'])) return 3500
  if (includesAny(rootCause, ['battery', 'display', 'panel', 'compressor', 'sealed-system'])) return 18000
  if (includesAny(rootCause, ['brake', 'drivetrain', 'derailleur', 'controller', 'relay'])) return 6500
  if (includesAny(rootCause, ['tire', 'tube', 'thermal', 'fan', 'coils'])) return 3500
  return Math.round(REPLACEMENT_VALUE_CENTS[caseRecord.category] * 0.35)
}

function effortFor(diagnosis: DiagnosisCompletePayload): 'easy' | 'medium' | 'hard' {
  const rootCause = diagnosis.rootCause.toLowerCase()
  if (diagnosis.safetyFlags.includes('refrigerant_leak')) return 'hard'
  if (includesAny(rootCause, ['thermal paste', 'blocked cooling', 'cooling path'])) return 'medium'
  if (includesAny(rootCause, ['dirty condenser', 'thermostat', 'start relay'])) return 'medium'
  if (includesAny(rootCause, ['display', 'battery pack', 'controller', 'compressor', 'sealed-system'])) return 'hard'
  if (includesAny(rootCause, ['brake', 'drivetrain', 'derailleur', 'relay', 'fan'])) return 'medium'
  return 'easy'
}

function partAvailabilityFor(diagnosis: DiagnosisCompletePayload): 'in_stock' | 'special_order' | 'scarce' {
  const rootCause = diagnosis.rootCause.toLowerCase()
  if (includesAny(rootCause, ['dirty condenser', 'thermostat', 'start relay'])) return 'in_stock'
  if (includesAny(rootCause, ['sealed-system', 'compressor', 'refrigerant'])) return 'scarce'
  if (includesAny(rootCause, ['display', 'battery pack', 'controller'])) return 'special_order'
  return 'in_stock'
}

function actionPlanFor(caseRecord: CaseRecord, diagnosis: DiagnosisCompletePayload): ActionPlanPayload {
  const involvesElectricity = caseRecord.category !== 'bicycle'
  const involvesDisassembly = !diagnosis.safetyFlags.includes('refrigerant_leak')
  return {
    steps: [
      {
        order: 1,
        title: 'Document the exact symptom',
        description: `Record when the ${caseRecord.category.replace('_', ' ')} issue appears, what changed before it started, and any sounds, smells, heat, or movement related to the fault.`,
        difficulty: 'easy',
        involvesDisassembly: false,
        involvesElectricity: false,
        involvesHeat: false,
        involvesPressure: false,
      },
      {
        order: 2,
        title: 'Check visible and low-risk causes',
        description: `Inspect the item for loose connections, blocked vents, worn parts, contamination, or obvious damage related to: ${diagnosis.rootCause}.`,
        difficulty: 'easy',
        involvesDisassembly: false,
        involvesElectricity,
        involvesHeat: false,
        involvesPressure: false,
      },
      {
        order: 3,
        title: diagnosis.safetyFlags.length ? 'Escalate safety-sensitive work' : 'Repair or replace the likely faulty part',
        description: diagnosis.safetyFlags.length
          ? 'Because this case has a safety flag, avoid risky disassembly and get help from a qualified repair volunteer or technician.'
          : 'If the visual checks match the diagnosis, replace or adjust the likely faulty part, then retest before returning the item to normal use.',
        difficulty: diagnosis.safetyFlags.length ? 'hard' : 'medium',
        involvesDisassembly,
        involvesElectricity,
        involvesHeat: diagnosis.safetyFlags.includes('battery_swelling') || diagnosis.safetyFlags.includes('scooter_battery_thermal'),
        involvesPressure: caseRecord.category === 'bicycle' || caseRecord.category === 'scooter',
      },
    ],
    technicianQuestions: diagnosis.technicianQuestions,
  }
}

export async function mockIntake(ctx: AgentContext, caseRecord: CaseRecord): Promise<IntakePayload> {
  const payload: IntakePayload = {
    symptoms: symptomList(caseRecord.symptoms),
    photoUrls: [],
    inferredCategory: caseRecord.category,
    confidence: caseRecord.symptoms.trim().length > 40 ? 0.85 : 0.68,
  }
  await ctx.emitEvent('intake', 'started')
  await ctx.emitEvent('intake', 'complete', payload)
  return payload
}

export async function mockDiagnosis(
  ctx: AgentContext,
  caseRecord: CaseRecord,
): Promise<DiagnosisCompletePayload> {
  const payload = diagnose(caseRecord)
  await ctx.emitEvent('diagnosis', 'started')
  await ctx.emitEvent('diagnosis', 'complete', payload)
  return payload
}

export async function mockEconomics(
  ctx: AgentContext,
  caseRecord: CaseRecord,
  _intakePayload: IntakePayload,
  diagnosisPayload: DiagnosisCompletePayload,
): Promise<EconomicsPayload> {
  const repairCostCents = estimateRepairCost(caseRecord, diagnosisPayload)
  const replacementValueCents = REPLACEMENT_VALUE_CENTS[caseRecord.category]
  const effort = effortFor(diagnosisPayload)
  const partAvailability = partAvailabilityFor(diagnosisPayload)
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
    uncertaintyNote: caseRecord.quoteCents != null
      ? 'The user-provided quote was used as the repair cost input.'
      : 'Cost is estimated from category, symptoms, likely part, and repair effort.',
  }
  await ctx.emitEvent('economics', 'complete', payload)
  return payload
}

export async function mockActionPlan(
  ctx: AgentContext,
  caseRecord: CaseRecord,
  diagnosisPayload: DiagnosisCompletePayload,
): Promise<ActionPlanPayload> {
  const payload = actionPlanFor(caseRecord, diagnosisPayload)
  await ctx.emitEvent('action_plan', 'complete', payload)
  return payload
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
