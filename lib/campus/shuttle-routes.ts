import {
  type CampusLocationId,
  isCampusLocationId,
} from './locations'

export interface ShuttleRecommendation {
  recommended: boolean
  routeId: string
  fromStop: CampusLocationId
  toStop: CampusLocationId
  walkMinutes: number
  rideMinutes: number
  reason: string
  sourceUrl: string
}

export const CPP_BRONCO_SHUTTLE_SOURCE_URL =
  'https://www.cpp.edu/transportation/commuting-to-campus/bronco-shuttle.shtml'

export const MAIN_CAMPUS_VILLAGE_DEMO_ROUTE = {
  routeId: 'main-campus-village-demo',
  name: 'Main Campus/Village Shuttle',
  fromStop: 'village',
  toStop: 'student-services-building',
  onwardDestinationId: 'ilab-building-1-room-113',
  rideMinutes: 8,
  walkMinutes: 4,
  sourceUrl: CPP_BRONCO_SHUTTLE_SOURCE_URL,
  notes: [
    'Estimates only; not real-time.',
    'Bronco ID required.',
    'Service may not operate during breaks or campus holidays.',
    'After reaching Student Services Building, walk to Building 1/iLab.',
  ],
} as const satisfies {
  routeId: string
  name: string
  fromStop: CampusLocationId
  toStop: CampusLocationId
  onwardDestinationId: CampusLocationId
  rideMinutes: number
  walkMinutes: number
  sourceUrl: string
  notes: readonly string[]
}

export function getShuttleRecommendation(
  from: CampusLocationId | string,
  to: CampusLocationId | string,
): ShuttleRecommendation {
  if (
    from === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop &&
    to === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.toStop
  ) {
    return {
      recommended: true,
      routeId: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.routeId,
      fromStop: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop,
      toStop: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.toStop,
      walkMinutes: 0,
      rideMinutes: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.rideMinutes,
      reason:
        'Estimated shuttle ride from The Village to the official Student Services Building shuttle stop.',
      sourceUrl: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.sourceUrl,
    }
  }

  if (
    from === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop &&
    to === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.onwardDestinationId
  ) {
    return {
      recommended: true,
      routeId: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.routeId,
      fromStop: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop,
      toStop: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.toStop,
      walkMinutes: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.walkMinutes,
      rideMinutes: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.rideMinutes,
      reason:
        'Estimated shuttle ride from The Village to Student Services Building only; after reaching that official shuttle stop, walk to Building 1/iLab.',
      sourceUrl: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.sourceUrl,
    }
  }

  return buildNoRecommendation(from, to)
}

function buildNoRecommendation(
  from: string,
  to: string,
): ShuttleRecommendation {
  const knownFrom = isCampusLocationId(from)
  const knownTo = isCampusLocationId(to)

  return {
    recommended: false,
    routeId: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.routeId,
    fromStop: knownFrom ? from : MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop,
    toStop: knownTo ? to : MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.toStop,
    walkMinutes: 0,
    rideMinutes: 0,
    reason: buildNoRecommendationReason(from, to, knownFrom, knownTo),
    sourceUrl: MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.sourceUrl,
  }
}

function buildNoRecommendationReason(
  from: string,
  to: string,
  knownFrom: boolean,
  knownTo: boolean,
): string {
  if (!knownFrom || !knownTo) {
    return 'No V1 demo shuttle recommendation is available because the origin or destination is not a known campus location ID.'
  }

  if (
    from === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.toStop &&
    (to === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.fromStop ||
      to === MAIN_CAMPUS_VILLAGE_DEMO_ROUTE.onwardDestinationId)
  ) {
    return 'No V1 demo shuttle recommendation is available for reverse-direction trips; this demo route only estimates The Village toward Student Services Building.'
  }

  return 'No V1 demo shuttle recommendation is available for this trip because the current demo route only helps trips starting at The Village toward Student Services Building or Building 1/iLab.'
}
