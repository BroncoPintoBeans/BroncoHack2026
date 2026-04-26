import { describe, expect, it } from 'vitest'
import {
  REVERSE_LOGISTICS_REPAIR_DESTINATIONS,
  REVERSE_LOGISTICS_REUSE_DESTINATIONS,
  recommendReverseLogisticsDestination,
} from '../../../lib/campus/reverse-logistics'
import type { CampusLocationId } from '../../../lib/campus/locations'

function destinationIdsFor(input: Parameters<typeof recommendReverseLogisticsDestination>[0]) {
  const recommendation = recommendReverseLogisticsDestination(input)

  return [
    recommendation.primary.locationId,
    ...recommendation.alternatives.map((destination) => destination.locationId),
  ]
}

function expectEveryDestinationToBeComplete(
  input: Parameters<typeof recommendReverseLogisticsDestination>[0],
) {
  const recommendation = recommendReverseLogisticsDestination(input)

  for (const destination of [
    recommendation.primary,
    ...recommendation.alternatives,
  ]) {
    expect(destination.label.trim().length).toBeGreaterThan(0)
    expect(destination.reason.trim().length).toBeGreaterThan(0)
    expect(destination.mapTextFallback.trim().length).toBeGreaterThan(0)
  }
}

describe('reverse logistics campus routing', () => {
  it('returns a full repair recommendation using only repair destinations', () => {
    const recommendation = recommendReverseLogisticsDestination({ intent: 'repair' })
    const destinationIds = [
      recommendation.primary.locationId,
      ...recommendation.alternatives.map((destination) => destination.locationId),
    ]

    expect(recommendation.primary.locationId).toBe('ilab-building-1-room-113')
    expect(recommendation.ruleId).toBe('campus-repair-routing-v1')
    expect(recommendation.confidence).toBe('medium')
    expect(recommendation.explanation).toContain('Repair intent')
    expect(recommendation.disclaimer).toContain('routing suggestions only')
    expect(destinationIds).toEqual(REVERSE_LOGISTICS_REPAIR_DESTINATIONS)
    expect(destinationIds).not.toContain('village')
  })

  it('returns iLab and Maker Studio as reuse destinations', () => {
    const destinationIds = destinationIdsFor({ intent: 'reuse' })

    expect(destinationIds).toEqual(REVERSE_LOGISTICS_REUSE_DESTINATIONS)
  })

  it('returns Bronco Bookstore and Bronco Tech as the parts destination', () => {
    const recommendation = recommendReverseLogisticsDestination({
      category: 'replacement parts',
    })

    expect(recommendation.primary.locationId).toBe(
      'bronco-bookstore-tech-building-66',
    )
    expect(recommendation.primary.label).toContain('Bronco Bookstore')
    expect(recommendation.alternatives).toEqual([])
  })

  it('honors explicit structured intent before conflicting category text', () => {
    const repairRecommendation = recommendReverseLogisticsDestination({
      intent: 'repair',
      itemCategory: 'phone charger',
    })
    const reuseRecommendation = recommendReverseLogisticsDestination({
      intent: 'reuse',
      category: 'replacement parts',
    })

    expect(repairRecommendation.primary.locationId).toBe(
      'ilab-building-1-room-113',
    )
    expect(
      repairRecommendation.alternatives.map(
        (destination) => destination.locationId,
      ),
    ).toContain('bronco-bookstore-tech-building-66')
    expect(reuseRecommendation.primary.locationId).toBe(
      'ilab-building-1-room-113',
    )
    expect(destinationIdsFor({ intent: 'reuse', category: 'replacement parts' })).toEqual(
      REVERSE_LOGISTICS_REUSE_DESTINATIONS,
    )
  })

  it('falls back to category scanning when structured intent is absent or unknown', () => {
    expect(
      recommendReverseLogisticsDestination({
        intent: 'not sure yet',
        category: 'phone charger',
      }).primary.locationId,
    ).toBe('bronco-bookstore-tech-building-66')
    expect(
      recommendReverseLogisticsDestination({
        category: 'broken laptop',
      }).primary.locationId,
    ).toBe('ilab-building-1-room-113')
  })

  it('does not match routing terms inside incidental substrings', () => {
    const apartmentRecommendation = recommendReverseLogisticsDestination({
      category: 'apartment fixture',
    })
    const departmentRecommendation = recommendReverseLogisticsDestination({
      itemCategory: 'department surplus',
    })

    expect(apartmentRecommendation.primary.locationId).toBe(
      'marketplace-exchange-public-meetup',
    )
    expect(apartmentRecommendation.confidence).toBe('low')
    expect(departmentRecommendation.primary.locationId).toBe(
      'marketplace-exchange-public-meetup',
    )
    expect(departmentRecommendation.confidence).toBe('low')
  })

  it('returns the public marketplace meetup location for exchange coordination', () => {
    const recommendation = recommendReverseLogisticsDestination('public exchange meetup')

    expect(recommendation.primary.locationId).toBe(
      'marketplace-exchange-public-meetup',
    )
    expect(recommendation.alternatives).toEqual([])
    expect(recommendation.confidence).toBe('high')
  })

  it('returns a low-confidence public meetup fallback with repair and reuse alternatives for unknown input', () => {
    const recommendation = recommendReverseLogisticsDestination({
      itemCategory: 'miscellaneous campus item',
    })
    const alternativeIds = recommendation.alternatives.map(
      (destination) => destination.locationId,
    )

    expect(recommendation.primary.locationId).toBe(
      'marketplace-exchange-public-meetup',
    )
    expect(recommendation.confidence).toBe('low')
    expect(alternativeIds).toContain('it-tech-help-library-2f')
    expect(alternativeIds).toContain('ilab-building-1-room-113')
    expect(alternativeIds).toContain('maker-studio-library-15-2f')
    expect(alternativeIds).not.toContain('village')
  })

  it('includes label, reason, and map text fallback on every destination option', () => {
    const inputs = [
      'repair',
      'reuse',
      'parts',
      'exchange',
      'ambiguous request',
    ] as const

    for (const input of inputs) {
      expectEveryDestinationToBeComplete(input)
    }
  })

  it('does not throw for unknown or missing input', () => {
    const unknownInputs = [
      undefined,
      null,
      '',
      { intent: undefined, category: null, itemCategory: '???' },
    ] satisfies Array<
      Parameters<typeof recommendReverseLogisticsDestination>[0]
    >

    for (const input of unknownInputs) {
      expect(() => recommendReverseLogisticsDestination(input)).not.toThrow()
      expect(recommendReverseLogisticsDestination(input).primary.locationId).toBe(
        'marketplace-exchange-public-meetup' satisfies CampusLocationId,
      )
    }
  })
})
