import type { ActionPlanPayload } from '../types/payloads'

const PREAMBLES: Record<string, string> = {
  battery_swelling:
    'Swollen lithium batteries are a fire and explosion risk. Do not attempt to puncture, bend, or charge the battery. Take it to a certified e-waste facility immediately.',
  refrigerant_leak:
    'Refrigerant exposure is a health hazard. Do not attempt to repair refrigerant lines yourself. Contact a licensed HVAC/R technician.',
  brake_failure:
    'Brake failure is a safety-critical issue. Do not ride this bicycle until repaired by a certified bicycle mechanic.',
  scooter_battery_thermal:
    'Thermal runaway in lithium batteries can cause fire. Power off the scooter immediately, keep it away from flammable materials, and contact the manufacturer.',
}

export function applySafetyGuard(payload: ActionPlanPayload, safetyFlags: string[]): ActionPlanPayload {
  if (safetyFlags.length === 0) return payload

  const filteredSteps = payload.steps.filter(step => {
    const isDangerous =
      step.involvesDisassembly || step.involvesElectricity || step.involvesHeat || step.involvesPressure
    return !(step.difficulty !== 'easy' && isDangerous)
  })

  const preambleParts = safetyFlags
    .map(flag => PREAMBLES[flag])
    .filter(Boolean)

  const safetyPreamble = preambleParts.length > 0 ? preambleParts.join('\n') : undefined

  return {
    steps: filteredSteps,
    safetyPreamble,
    technicianQuestions: payload.technicianQuestions,
  }
}
