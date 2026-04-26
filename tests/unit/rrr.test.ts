import { describe, it, expect } from 'vitest'
import { computeRrr } from '../../lib/utils/rrr'

describe('computeRrr', () => {
  it('score >= 0.70 → repair_now', () => {
    // diagnosisConfidence=1 → 0.35, costFactor=1 → 0.25, effort=easy → 0.20, in_stock → 0.10, urgency=low → 0.10 = 1.00
    const { score, label } = computeRrr({
      diagnosisConfidence: 1.0,
      repairCostCents: 0,
      replacementValueCents: 100,
      effort: 'easy',
      partAvailability: 'in_stock',
      urgency: 'low',
    })
    expect(score).toBeGreaterThanOrEqual(0.70)
    expect(label).toBe('repair_now')
  })

  it('score in [0.55, 0.70) → repair_if_cheap', () => {
    // diagnosisConfidence=0.5→0.175, costFactor=0.5→0.125, effort=medium→0.12, in_stock→0.10, normal→0.07 = 0.59
    const { score, label } = computeRrr({
      diagnosisConfidence: 0.5,
      repairCostCents: 50,
      replacementValueCents: 100,
      effort: 'medium',
      partAvailability: 'in_stock',
      urgency: 'normal',
    })
    expect(score).toBeGreaterThanOrEqual(0.55)
    expect(score).toBeLessThan(0.70)
    expect(label).toBe('repair_if_cheap')
  })

  it('score in [0.40, 0.55) → wait_monitor', () => {
    // diagnosisConfidence=0.3→0.105, costFactor=0.5→0.125, effort=medium→0.12, special_order→0.05, normal→0.07 = 0.47
    const { score, label } = computeRrr({
      diagnosisConfidence: 0.3,
      repairCostCents: 50,
      replacementValueCents: 100,
      effort: 'medium',
      partAvailability: 'special_order',
      urgency: 'normal',
    })
    expect(score).toBeGreaterThanOrEqual(0.40)
    expect(score).toBeLessThan(0.55)
    expect(label).toBe('wait_monitor')
  })

  it('score in [0.25, 0.40) → replace_soon', () => {
    // diagnosisConfidence=0.1→0.035, costFactor=0→0, effort=hard→0.06, scarce→0, urgent→0.04 = 0.135 — too low
    // Try: diagnosisConfidence=0.5→0.175, costFactor=0.2→0.05, hard→0.06, scarce→0, urgent→0.04 = 0.325
    const { score, label } = computeRrr({
      diagnosisConfidence: 0.5,
      repairCostCents: 80,
      replacementValueCents: 100,
      effort: 'hard',
      partAvailability: 'scarce',
      urgency: 'urgent',
    })
    expect(score).toBeGreaterThanOrEqual(0.25)
    expect(score).toBeLessThan(0.40)
    expect(label).toBe('replace_soon')
  })

  it('score < 0.25 → replace_now', () => {
    // diagnosisConfidence=0.1→0.035, costFactor=0→0, effort=hard→0.06, scarce→0, urgent→0.04 = 0.135
    const { score, label } = computeRrr({
      diagnosisConfidence: 0.1,
      repairCostCents: 100,
      replacementValueCents: 100,
      effort: 'hard',
      partAvailability: 'scarce',
      urgency: 'urgent',
    })
    expect(score).toBeLessThan(0.25)
    expect(label).toBe('replace_now')
  })

  it('golden: laptop demo inputs → repair_now, score in [0.77, 0.80]', () => {
    // MacBook thermal paste: $150 repair vs $550 refurb, high confidence, medium effort, parts in stock, normal urgency
    // costFactor = 1 - 15000/55000 = 0.7272 → score ≈ 0.308 + 0.182 + 0.12 + 0.10 + 0.07 = 0.780
    const { score, label } = computeRrr({
      diagnosisConfidence: 0.88,
      repairCostCents: 15000,
      replacementValueCents: 55000,
      effort: 'medium',
      partAvailability: 'in_stock',
      urgency: 'normal',
    })
    expect(label).toBe('repair_now')
    expect(score).toBeGreaterThanOrEqual(0.77)
    expect(score).toBeLessThanOrEqual(0.80)
  })
})
