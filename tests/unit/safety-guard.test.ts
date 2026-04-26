import { describe, it, expect } from 'vitest'
import { applySafetyGuard } from '../../lib/utils/safety-guard'
import type { ActionPlanPayload } from '../../lib/types/payloads'

const BASE_PLAN: ActionPlanPayload = {
  steps: [
    {
      order: 1,
      title: 'Power down',
      description: 'Shut down completely.',
      difficulty: 'easy',
      involvesDisassembly: false,
      involvesElectricity: false,
      involvesHeat: false,
      involvesPressure: false,
    },
    {
      order: 2,
      title: 'Remove screws',
      description: 'Use a screwdriver.',
      difficulty: 'medium',
      involvesDisassembly: true,
      involvesElectricity: false,
      involvesHeat: false,
      involvesPressure: false,
    },
    {
      order: 3,
      title: 'Replace battery',
      description: 'Swap the battery.',
      difficulty: 'hard',
      involvesDisassembly: true,
      involvesElectricity: true,
      involvesHeat: false,
      involvesPressure: false,
    },
  ],
  technicianQuestions: ['Has the device been dropped?'],
}

describe('applySafetyGuard', () => {
  it('empty flags → plan returned unchanged', () => {
    const result = applySafetyGuard(BASE_PLAN, [])
    expect(result.steps).toHaveLength(3)
    expect(result.safetyPreamble).toBeUndefined()
    expect(result.technicianQuestions).toEqual(BASE_PLAN.technicianQuestions)
  })

  it('battery_swelling → medium/hard dangerous steps removed, preamble set', () => {
    const result = applySafetyGuard(BASE_PLAN, ['battery_swelling'])
    // step 1 (easy, no danger) kept; steps 2 and 3 (medium/hard + disassembly) removed
    expect(result.steps).toHaveLength(1)
    expect(result.steps[0].order).toBe(1)
    expect(result.safetyPreamble).toMatch(/Swollen lithium batteries/)
  })

  it('refrigerant_leak → preamble mentions HVAC', () => {
    const result = applySafetyGuard(BASE_PLAN, ['refrigerant_leak'])
    expect(result.safetyPreamble).toMatch(/Refrigerant exposure/)
  })

  it('brake_failure → preamble mentions bicycle mechanic', () => {
    const result = applySafetyGuard(BASE_PLAN, ['brake_failure'])
    expect(result.safetyPreamble).toMatch(/Brake failure/)
  })

  it('scooter_battery_thermal → preamble mentions thermal runaway', () => {
    const result = applySafetyGuard(BASE_PLAN, ['scooter_battery_thermal'])
    expect(result.safetyPreamble).toMatch(/Thermal runaway/)
  })

  it('technicianQuestions always preserved', () => {
    const result = applySafetyGuard(BASE_PLAN, ['battery_swelling'])
    expect(result.technicianQuestions).toEqual(BASE_PLAN.technicianQuestions)
  })
})
