import { describe, expect, it } from 'vitest'
import {
  CAMPUS_LOCATIONS,
  CAMPUS_LOCATION_IDS,
  getCampusLocation,
  getCampusLocationName,
  resolveListingCampusLocation,
} from '../../../lib/campus/locations'

const EXPECTED_IDS = [
  'village',
  'student-services-building',
  'ilab-building-1-room-113',
  'maker-studio-library-15-2f',
  'it-tech-help-library-2f',
  'bronco-bookstore-tech-building-66',
  'marketplace-exchange-public-meetup',
]

describe('campus location registry', () => {
  it('contains all seven canonical IDs exactly once', () => {
    expect(CAMPUS_LOCATION_IDS).toEqual(EXPECTED_IDS)
    expect(new Set(CAMPUS_LOCATION_IDS).size).toBe(EXPECTED_IDS.length)
    expect(CAMPUS_LOCATIONS).toHaveLength(EXPECTED_IDS.length)
  })

  it('includes required display, map, and accessibility fields for every location', () => {
    for (const location of CAMPUS_LOCATIONS) {
      expect(location.types.length).toBeGreaterThan(0)
      expect(location.directions.trim().length).toBeGreaterThan(0)
      expect(location.accessibilityNote.trim().length).toBeGreaterThan(0)
      expect(location.concept3d.mapId).toBe('1130')
      expect(location.concept3d.fallbackUrl).toBe('https://www.cpp.edu/maps/?id=1130')
      expect(location.concept3d.markerId).toBeUndefined()
    }
  })

  it('uses expected campus areas for core route landmarks', () => {
    expect(getCampusLocation('village')?.campusArea).toBe('west')
    expect(getCampusLocation('student-services-building')?.campusArea).toBe(
      'main-campus',
    )
    expect(getCampusLocation('ilab-building-1-room-113')?.campusArea).toBe(
      'main-campus',
    )
  })

  it('returns known locations and names by ID', () => {
    expect(getCampusLocation('student-services-building')?.name).toBe(
      'Student Services Building',
    )
    expect(getCampusLocationName('village')).toBe('The Village')
  })

  it('returns null for unknown or missing IDs', () => {
    expect(getCampusLocation('unknown-location')).toBeNull()
    expect(getCampusLocation(null)).toBeNull()
    expect(getCampusLocation(undefined)).toBeNull()
    expect(getCampusLocationName('unknown-location')).toBeNull()
  })

  it('preserves text-only listing compatibility when optional ID is missing or unknown', () => {
    expect(resolveListingCampusLocation({ pickupLocation: 'Free text spot' })).toBeNull()
    expect(
      resolveListingCampusLocation({
        pickupLocation: 'Free text spot',
        pickupLocationId: 'unknown-location',
      }),
    ).toBeNull()
  })

  it('resolves listing location only from a known optional pickupLocationId', () => {
    expect(
      resolveListingCampusLocation({
        pickupLocation: 'Legacy text can differ',
        pickupLocationId: 'maker-studio-library-15-2f',
      })?.name,
    ).toBe('Maker Studio, Library Building 15 2nd floor')
  })
})
