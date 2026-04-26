import type { VerdictLabel } from '../types/agents'
import type { RrrBreakdown } from '../types/payloads'

export interface RrrInputs {
  diagnosisConfidence: number
  repairCostCents: number
  replacementValueCents: number
  effort: 'easy' | 'medium' | 'hard'
  partAvailability: 'in_stock' | 'special_order' | 'scarce'
  urgency: 'low' | 'normal' | 'urgent'
}

const EFFORT_FACTOR: Record<RrrInputs['effort'], number> = { easy: 1.0, medium: 0.6, hard: 0.3 }
const PART_FACTOR: Record<RrrInputs['partAvailability'], number> = { in_stock: 1.0, special_order: 0.5, scarce: 0.0 }
const URGENCY_FACTOR: Record<RrrInputs['urgency'], number> = { low: 1.0, normal: 0.7, urgent: 0.4 }

export function computeRrr(inputs: RrrInputs): { score: number; label: VerdictLabel; breakdown: RrrBreakdown } {
  const costFactor = Math.max(0, Math.min(1, 1 - inputs.repairCostCents / inputs.replacementValueCents))
  const effortFactor = EFFORT_FACTOR[inputs.effort]
  const partAvailability = PART_FACTOR[inputs.partAvailability]
  const urgencyFactor = URGENCY_FACTOR[inputs.urgency]

  const score =
    0.35 * inputs.diagnosisConfidence +
    0.25 * costFactor +
    0.20 * effortFactor +
    0.10 * partAvailability +
    0.10 * urgencyFactor

  const breakdown: RrrBreakdown = {
    diagnosisConfidence: inputs.diagnosisConfidence,
    costFactor,
    effortFactor,
    partAvailability,
    urgencyFactor,
  }

  const label = scoreToLabel(score)
  return { score, label, breakdown }
}

function scoreToLabel(score: number): VerdictLabel {
  if (score >= 0.70) return 'repair_now'
  if (score >= 0.55) return 'repair_if_cheap'
  if (score >= 0.40) return 'wait_monitor'
  if (score >= 0.25) return 'replace_soon'
  return 'replace_now'
}
