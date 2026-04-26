import { describe, expect, it } from 'vitest'
import {
  CPP_CONCEPT3D_BASE_URL,
  buildCampusLocationLink,
  buildCampusMapIframeSrc,
  buildCampusMapUrl,
  buildTextMapFallback,
} from '../../../lib/campus/concept3d'
import { getCampusLocation } from '../../../lib/campus/locations'

describe('Concept3D campus map helpers', () => {
  it('returns the CPP base map URL when no marker is provided', () => {
    expect(buildCampusMapUrl()).toBe('https://www.cpp.edu/maps/?id=1130')
    expect(buildCampusMapUrl({})).toBe('https://www.cpp.edu/maps/?id=1130')
    expect(buildCampusMapUrl({ markerId: '   ' })).toBe(
      'https://www.cpp.edu/maps/?id=1130',
    )
  })

  it('builds iframe src without requiring marker IDs', () => {
    const location = getCampusLocation('student-services-building')

    expect(buildCampusMapIframeSrc()).toBe(CPP_CONCEPT3D_BASE_URL)
    expect(buildCampusMapIframeSrc(location)).toBe(CPP_CONCEPT3D_BASE_URL)
    expect(buildCampusMapIframeSrc(location?.concept3d)).toBe(CPP_CONCEPT3D_BASE_URL)
  })

  it('builds text fallback URLs without requiring marker IDs', () => {
    const location = getCampusLocation('village')

    expect(buildTextMapFallback()).toBe(CPP_CONCEPT3D_BASE_URL)
    expect(buildTextMapFallback(location)).toBe(CPP_CONCEPT3D_BASE_URL)
  })

  it('builds campus location links with the location name and base map href', () => {
    const location = getCampusLocation('student-services-building')

    expect(location).not.toBeNull()
    const link = buildCampusLocationLink(location!)

    expect(link.href).toBe(CPP_CONCEPT3D_BASE_URL)
    expect(link.label).toContain('Student Services Building')
    expect(link.label).toBe('Open CPP campus map for Student Services Building')
  })
})
