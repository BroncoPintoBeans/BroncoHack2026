import type { CampusLocation, Concept3DMapTarget } from './locations'

export const CPP_CONCEPT3D_MAP_ID = '1130'
export const CPP_CONCEPT3D_BASE_URL = 'https://www.cpp.edu/maps/?id=1130'

export function buildCampusMapUrl(_args?: { markerId?: string }): string {
  return CPP_CONCEPT3D_BASE_URL
}

export function buildCampusMapIframeSrc(
  target?: CampusLocation | Concept3DMapTarget | null,
): string {
  const concept3d = target && 'concept3d' in target ? target.concept3d : target

  return buildCampusMapUrl({ markerId: concept3d?.markerId })
}

export function buildTextMapFallback(location?: CampusLocation | null): string {
  return location?.concept3d.fallbackUrl ?? CPP_CONCEPT3D_BASE_URL
}

export function buildCampusLocationLink(location: CampusLocation): {
  href: string
  label: string
} {
  return {
    href: buildTextMapFallback(location),
    label: `Open CPP campus map for ${location.name}`,
  }
}
