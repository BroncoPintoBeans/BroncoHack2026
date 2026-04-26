import { describe, expect, it } from 'vitest'
import {
  CPP_BRONCO_SHUTTLE_SOURCE_URL,
  MAIN_CAMPUS_VILLAGE_DEMO_ROUTE,
  getShuttleRecommendation,
} from '../../../lib/campus/shuttle-routes'

const SOURCE_URL =
  'https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml'

function expectOfficialSource(from: string, to: string) {
  expect(getShuttleRecommendation(from, to).sourceUrl).toBe(SOURCE_URL)
}

describe('campus shuttle route recommendations', () => {
  it('freezes the Main Campus/Village demo route fields and notes', () => {
    expect(MAIN_CAMPUS_VILLAGE_DEMO_ROUTE).toEqual({
      routeId: 'main-campus-village-demo',
      name: 'Main Campus/Village Shuttle',
      fromStop: 'village',
      toStop: 'student-services-building',
      onwardDestinationId: 'ilab-building-1-room-113',
      rideMinutes: 8,
      walkMinutes: 4,
      sourceUrl: SOURCE_URL,
      notes: [
        'Estimates only; not real-time.',
        'Bronco ID required.',
        'Service may not operate during breaks or campus holidays.',
        'After reaching Student Services Building, walk to Building 1/iLab.',
      ],
    })
    expect(CPP_BRONCO_SHUTTLE_SOURCE_URL).toBe(SOURCE_URL)
  })

  it('recommends the exact estimated shuttle output from The Village to Student Services Building', () => {
    expect(getShuttleRecommendation('village', 'student-services-building')).toEqual({
      recommended: true,
      routeId: 'main-campus-village-demo',
      fromStop: 'village',
      toStop: 'student-services-building',
      walkMinutes: 0,
      rideMinutes: 8,
      reason:
        'Estimated shuttle ride from The Village to the official Student Services Building shuttle stop.',
      sourceUrl: SOURCE_URL,
    })
  })

  it('recommends the demo shuttle to iLab via Student Services Building with the onward walk estimate', () => {
    const recommendation = getShuttleRecommendation(
      'village',
      'ilab-building-1-room-113',
    )

    expect(recommendation).toMatchObject({
      recommended: true,
      routeId: 'main-campus-village-demo',
      fromStop: 'village',
      toStop: 'student-services-building',
      rideMinutes: 8,
      walkMinutes: 4,
      sourceUrl: SOURCE_URL,
    })
    expect(recommendation.reason).toContain('Student Services Building only')
    expect(recommendation.reason).toContain('walk to Building 1/iLab')
  })

  it('does not recommend reverse-direction trips', () => {
    const villageRecommendation = getShuttleRecommendation(
      'student-services-building',
      'village',
    )
    const ilabRecommendation = getShuttleRecommendation(
      'student-services-building',
      'ilab-building-1-room-113',
    )

    expect(villageRecommendation.recommended).toBe(false)
    expect(villageRecommendation.reason).toContain('reverse-direction')
    expect(ilabRecommendation.recommended).toBe(false)
    expect(ilabRecommendation.reason).toContain('reverse-direction')
  })

  it('does not recommend trips that do not benefit from the demo route', () => {
    const recommendation = getShuttleRecommendation(
      'maker-studio-library-15-2f',
      'it-tech-help-library-2f',
    )

    expect(recommendation.recommended).toBe(false)
    expect(recommendation.rideMinutes).toBe(0)
    expect(recommendation.walkMinutes).toBe(0)
    expect(recommendation.reason).toContain('only helps trips starting at The Village')
  })

  it('does not throw on unknown string IDs and returns no recommendation', () => {
    expect(() =>
      getShuttleRecommendation('unknown-origin', 'unknown-destination'),
    ).not.toThrow()

    const recommendation = getShuttleRecommendation(
      'unknown-origin',
      'unknown-destination',
    )

    expect(recommendation.recommended).toBe(false)
    expect(recommendation.sourceUrl).toBe(SOURCE_URL)
    expect(recommendation.reason).toContain('not a known campus location ID')
  })

  it('uses the official CPP shuttle page for every recommendation path', () => {
    expectOfficialSource('village', 'student-services-building')
    expectOfficialSource('village', 'ilab-building-1-room-113')
    expectOfficialSource('student-services-building', 'village')
    expectOfficialSource('maker-studio-library-15-2f', 'it-tech-help-library-2f')
    expectOfficialSource('unknown-origin', 'unknown-destination')
  })

  it('keeps recommendation reasons as estimates instead of live ETA claims', () => {
    const recommendations = [
      getShuttleRecommendation('village', 'student-services-building'),
      getShuttleRecommendation('village', 'ilab-building-1-room-113'),
      getShuttleRecommendation('student-services-building', 'village'),
      getShuttleRecommendation('maker-studio-library-15-2f', 'it-tech-help-library-2f'),
      getShuttleRecommendation('unknown-origin', 'unknown-destination'),
    ]

    for (const recommendation of recommendations) {
      expect(recommendation.reason).not.toMatch(/\blive ETA\b/i)
      expect(recommendation.reason).not.toMatch(/\breal-time ETA\b/i)
      expect(recommendation.reason).not.toMatch(/\barriv(?:e|es|ing)\b/i)
    }
  })
})
