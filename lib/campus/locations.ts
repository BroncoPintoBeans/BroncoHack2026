import {
  CPP_CONCEPT3D_BASE_URL,
  CPP_CONCEPT3D_MAP_ID,
  buildCampusMapUrl,
} from './concept3d'

export type CampusLocationId =
  | 'village'
  | 'student-services-building'
  | 'ilab-building-1-room-113'
  | 'maker-studio-library-15-2f'
  | 'it-tech-help-library-2f'
  | 'bronco-bookstore-tech-building-66'
  | 'marketplace-exchange-public-meetup'

export type CampusLocationType =
  | 'pickup_zone'
  | 'shuttle_stop'
  | 'map_landmark'
  | 'repair_destination'
  | 'reuse_destination'
  | 'parts_destination'
  | 'meetup_zone'

export type CampusArea =
  | 'west'
  | 'main-campus'
  | 'library'
  | 'bookstore'
  | 'marketplace'

export interface Concept3DMapTarget {
  mapId: '1130'
  markerId?: string
  url: string
  fallbackUrl: string
  label: string
}

export interface CampusLocation {
  id: CampusLocationId
  name: string
  types: CampusLocationType[]
  campusArea: CampusArea
  concept3d: Concept3DMapTarget
  directions: string
  accessibilityNote: string
  sourceUrl?: string
}

export interface ListingLocationFields {
  pickupLocation: string
  pickupLocationId?: CampusLocationId | string
}

function concept3dTarget(label: string): Concept3DMapTarget {
  return {
    mapId: CPP_CONCEPT3D_MAP_ID,
    url: buildCampusMapUrl(),
    fallbackUrl: CPP_CONCEPT3D_BASE_URL,
    label,
  }
}

export const CAMPUS_LOCATIONS = [
  {
    id: 'village',
    name: 'The Village',
    types: ['pickup_zone', 'shuttle_stop'],
    campusArea: 'west',
    concept3d: concept3dTarget('The Village on the CPP campus map'),
    directions:
      'Use The Village as the west-campus pickup and shuttle reference point. Meet only in visible public outdoor areas and confirm the exact spot in messages.',
    accessibilityNote:
      'Public routes around The Village may vary by construction, grade, and shuttle operations. Check the official CPP map and posted campus signs for the most suitable accessible path before traveling.',
  },
  {
    id: 'student-services-building',
    name: 'Student Services Building',
    types: ['shuttle_stop', 'map_landmark'],
    campusArea: 'main-campus',
    concept3d: concept3dTarget('Student Services Building on the CPP campus map'),
    directions:
      'Use Student Services Building as the main-campus landmark and shuttle stop reference. It is a recognizable public destination for orienting toward central campus.',
    accessibilityNote:
      'Accessible approaches can depend on current campus routing and nearby construction. Confirm the best route with the official CPP map, posted signs, or campus staff when needed.',
  },
  {
    id: 'ilab-building-1-room-113',
    name: 'iLab, Building 1 Room 113',
    types: ['repair_destination', 'reuse_destination'],
    campusArea: 'main-campus',
    concept3d: concept3dTarget('iLab, Building 1 Room 113 on the CPP campus map'),
    directions:
      'Navigate to Building 1 on main campus, then look for iLab Room 113. Confirm hours, staff availability, and the exact room before bringing an item.',
    accessibilityNote:
      'This room-level destination has not been verified for a specific accessible indoor route. Use official building information and ask staff for the best current accessible path.',
  },
  {
    id: 'maker-studio-library-15-2f',
    name: 'Maker Studio, Library Building 15 2nd floor',
    types: ['repair_destination', 'reuse_destination'],
    campusArea: 'library',
    concept3d: concept3dTarget('Maker Studio, Library Building 15 2nd floor on the CPP campus map'),
    directions:
      'Go to University Library Building 15 and proceed to the 2nd floor for the Maker Studio. Confirm the studio schedule before planning a repair or reuse drop-off.',
    accessibilityNote:
      'Second-floor access may require elevators or alternate indoor routing. Check current library access information and posted signs rather than assuming a specific accessible route.',
  },
  {
    id: 'it-tech-help-library-2f',
    name: 'IT Tech Help Desk, University Library 2nd floor',
    types: ['repair_destination'],
    campusArea: 'library',
    concept3d: concept3dTarget('IT Tech Help Desk, University Library 2nd floor on the CPP campus map'),
    directions:
      'Go to University Library Building 15 and proceed to the 2nd floor IT Tech Help Desk area. Confirm service hours and whether your device issue is supported before visiting.',
    accessibilityNote:
      'Library access paths and elevator availability can change. Verify current access details through official CPP resources or on-site signage before traveling.',
  },
  {
    id: 'bronco-bookstore-tech-building-66',
    name: 'Bronco Bookstore/Bronco Tech, Building 66',
    types: ['repair_destination', 'parts_destination'],
    campusArea: 'bookstore',
    concept3d: concept3dTarget('Bronco Bookstore/Bronco Tech, Building 66 on the CPP campus map'),
    directions:
      'Navigate to Building 66 for Bronco Bookstore and Bronco Tech services. Confirm store hours, parts availability, and service scope before relying on this destination.',
    accessibilityNote:
      'Use official CPP map information and posted building guidance for accessible approaches. Do not assume product pickup or service counters are available without confirmation.',
  },
  {
    id: 'marketplace-exchange-public-meetup',
    name: 'Public Marketplace exchange meetup area',
    types: ['meetup_zone'],
    campusArea: 'marketplace',
    concept3d: concept3dTarget('Public Marketplace exchange meetup area on the CPP campus map'),
    directions:
      'Use this as a general public meetup placeholder for Marketplace exchanges. Choose a visible campus area, avoid private rooms or residences, and confirm the exact public spot in messages.',
    accessibilityNote:
      'Because this is a flexible public meetup area, accessibility depends on the final agreed location. Pick a visible location with a route both people can use and verify details before meeting.',
  },
] as const satisfies readonly CampusLocation[]

export const CAMPUS_LOCATION_IDS = CAMPUS_LOCATIONS.map(
  (location) => location.id,
) as CampusLocationId[]

const CAMPUS_LOCATION_BY_ID = new Map<CampusLocationId, CampusLocation>(
  CAMPUS_LOCATIONS.map((location) => [location.id, location]),
)

export function isCampusLocationId(
  id: string | null | undefined,
): id is CampusLocationId {
  return typeof id === 'string' && CAMPUS_LOCATION_BY_ID.has(id as CampusLocationId)
}

export function getCampusLocation(
  id: string | null | undefined,
): CampusLocation | null {
  if (!isCampusLocationId(id)) {
    return null
  }

  return CAMPUS_LOCATION_BY_ID.get(id) ?? null
}

export function getCampusLocationName(
  id: string | null | undefined,
): string | null {
  return getCampusLocation(id)?.name ?? null
}

export function resolveListingCampusLocation(
  fields: ListingLocationFields,
): CampusLocation | null {
  return getCampusLocation(fields.pickupLocationId)
}
