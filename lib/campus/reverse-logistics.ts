import { buildTextMapFallback } from './concept3d'
import {
  type CampusLocation,
  type CampusLocationId,
  getCampusLocation,
} from './locations'

export interface ReverseLogisticsDestinationOption {
  locationId: CampusLocationId
  label: string
  reason: string
  mapUrl?: string
  mapTextFallback: string
}

export interface ReverseLogisticsRecommendation {
  primary: ReverseLogisticsDestinationOption
  alternatives: ReverseLogisticsDestinationOption[]
  ruleId: string
  confidence: 'high' | 'medium' | 'low'
  explanation: string
  disclaimer: string
}

export interface ReverseLogisticsRequest {
  intent?: string | null
  category?: string | null
  itemCategory?: string | null
}

export type ReverseLogisticsIntent =
  | 'repair'
  | 'reuse'
  | 'parts'
  | 'public-exchange'
  | 'unknown'

export const REVERSE_LOGISTICS_REPAIR_DESTINATIONS = [
  'ilab-building-1-room-113',
  'maker-studio-library-15-2f',
  'it-tech-help-library-2f',
  'bronco-bookstore-tech-building-66',
] as const satisfies readonly CampusLocationId[]

export const REVERSE_LOGISTICS_REUSE_DESTINATIONS = [
  'ilab-building-1-room-113',
  'maker-studio-library-15-2f',
] as const satisfies readonly CampusLocationId[]

export const REVERSE_LOGISTICS_PARTS_DESTINATIONS = [
  'bronco-bookstore-tech-building-66',
] as const satisfies readonly CampusLocationId[]

export const REVERSE_LOGISTICS_PUBLIC_EXCHANGE_DESTINATIONS = [
  'marketplace-exchange-public-meetup',
] as const satisfies readonly CampusLocationId[]

export const REVERSE_LOGISTICS_UNKNOWN_ALTERNATIVES = [
  'it-tech-help-library-2f',
  'ilab-building-1-room-113',
  'maker-studio-library-15-2f',
  'bronco-bookstore-tech-building-66',
] as const satisfies readonly CampusLocationId[]

export const REVERSE_LOGISTICS_DISCLAIMER =
  'Campus reverse-logistics recommendations are routing suggestions only. Verify current hours, service eligibility, staff availability, item acceptance, prices, and accessible routes with the relevant campus resource before traveling or exchanging an item.'

interface ReverseLogisticsRule {
  ruleId: string
  confidence: ReverseLogisticsRecommendation['confidence']
  primary: CampusLocationId
  alternatives: readonly CampusLocationId[]
  reasonByLocation: Partial<Record<CampusLocationId, string>>
  explanation: string
}

const REVERSE_LOGISTICS_RULES: Record<ReverseLogisticsIntent, ReverseLogisticsRule> = {
  repair: {
    ruleId: 'campus-repair-routing-v1',
    confidence: 'medium',
    primary: 'ilab-building-1-room-113',
    alternatives: [
      'maker-studio-library-15-2f',
      'it-tech-help-library-2f',
      'bronco-bookstore-tech-building-66',
    ],
    reasonByLocation: {
      'ilab-building-1-room-113':
        'General campus repair routing option for triage, reuse-minded fixes, or hands-on support.',
      'maker-studio-library-15-2f':
        'Campus maker space routing option for repair work that may need tools or fabrication support.',
      'it-tech-help-library-2f':
        'Technology support routing option for device troubleshooting or IT help.',
      'bronco-bookstore-tech-building-66':
        'Bookstore and Bronco Tech routing option for technology service or related support.',
    },
    explanation:
      'Repair intent is routed to known campus repair destinations without asserting availability, acceptance, pricing, or official service scope.',
  },
  reuse: {
    ruleId: 'campus-reuse-routing-v1',
    confidence: 'medium',
    primary: 'ilab-building-1-room-113',
    alternatives: ['maker-studio-library-15-2f'],
    reasonByLocation: {
      'ilab-building-1-room-113':
        'Reuse routing option for items that may benefit from hands-on assessment or campus repair culture support.',
      'maker-studio-library-15-2f':
        'Reuse routing option for items that may need maker-space tools, prototyping, or repurposing support.',
    },
    explanation:
      'Reuse intent is routed to campus reuse destinations without deciding whether a resource accepts the item.',
  },
  parts: {
    ruleId: 'campus-parts-routing-v1',
    confidence: 'medium',
    primary: 'bronco-bookstore-tech-building-66',
    alternatives: [],
    reasonByLocation: {
      'bronco-bookstore-tech-building-66':
        'Parts routing option for bookstore and Bronco Tech support around accessories, parts, or related technology needs.',
    },
    explanation:
      'Parts intent is routed to the known campus parts destination without asserting inventory, pricing, or service eligibility.',
  },
  'public-exchange': {
    ruleId: 'campus-public-exchange-routing-v1',
    confidence: 'high',
    primary: 'marketplace-exchange-public-meetup',
    alternatives: [],
    reasonByLocation: {
      'marketplace-exchange-public-meetup':
        'Public meetup routing option for coordinating a visible campus exchange instead of using private rooms or residences.',
    },
    explanation:
      'Public exchange intent is routed to the Marketplace meetup placeholder so participants can coordinate an exact visible campus spot.',
  },
  unknown: {
    ruleId: 'campus-ambiguous-routing-v1',
    confidence: 'low',
    primary: 'marketplace-exchange-public-meetup',
    alternatives: REVERSE_LOGISTICS_UNKNOWN_ALTERNATIVES,
    reasonByLocation: {
      'marketplace-exchange-public-meetup':
        'Low-confidence fallback for ambiguous requests that may need public coordination before choosing a repair or reuse route.',
      'it-tech-help-library-2f':
        'Repair alternative for device or technology issues if the item turns out to need IT support.',
      'ilab-building-1-room-113':
        'Repair or reuse alternative for items that may benefit from hands-on campus support.',
      'maker-studio-library-15-2f':
        'Repair or reuse alternative for items that may need tools, prototyping, or repurposing support.',
      'bronco-bookstore-tech-building-66':
        'Repair or parts alternative for technology service, accessories, or related support.',
    },
    explanation:
      'Unknown or ambiguous intent falls back to a public meetup recommendation and repair or reuse alternatives instead of failing.',
  },
}

export function normalizeReverseLogisticsIntent(
  input?: ReverseLogisticsRequest | string | null,
): ReverseLogisticsIntent {
  if (typeof input === 'string') {
    return resolveIntentFromText(input) ?? 'unknown'
  }

  if (!input) {
    return 'unknown'
  }

  const explicitIntent = normalizeText(input.intent)

  if (explicitIntent) {
    const resolvedIntent = resolveIntentFromText(explicitIntent)

    if (resolvedIntent) {
      return resolvedIntent
    }
  }

  return (
    resolveIntentFromText([input.category, input.itemCategory].join(' ')) ??
    'unknown'
  )
}

function resolveIntentFromText(text: string | null | undefined): ReverseLogisticsIntent | null {
  const normalizedText = normalizeText(text)

  if (!normalizedText) {
    return null
  }

  if (
    matchesAny(normalizedText, [
      'meetup',
      'meet up',
      'exchange',
      'handoff',
      'pickup',
      'pick up',
    ])
  ) {
    return 'public-exchange'
  }

  if (
    matchesAny(normalizedText, [
      'part',
      'parts',
      'accessory',
      'accessories',
      'adapter',
      'charger',
    ])
  ) {
    return 'parts'
  }

  if (
    matchesAny(normalizedText, [
      'reuse',
      'repurpose',
      'donate',
      'donation',
      'upcycle',
      'rehome',
    ])
  ) {
    return 'reuse'
  }

  if (
    matchesAny(normalizedText, [
      'repair',
      'repairs',
      'fix',
      'fixed',
      'broken',
      'troubleshoot',
      'diagnose',
      'service',
    ])
  ) {
    return 'repair'
  }

  return null
}

export function recommendReverseLogisticsDestination(
  input?: ReverseLogisticsRequest | string | null,
): ReverseLogisticsRecommendation {
  const intent = normalizeReverseLogisticsIntent(input)
  const rule = REVERSE_LOGISTICS_RULES[intent]

  return {
    primary: buildDestinationOption(rule.primary, rule),
    alternatives: rule.alternatives.map((locationId) =>
      buildDestinationOption(locationId, rule),
    ),
    ruleId: rule.ruleId,
    confidence: rule.confidence,
    explanation: rule.explanation,
    disclaimer: REVERSE_LOGISTICS_DISCLAIMER,
  }
}

export function getReverseLogisticsDestinationsForIntent(
  intent: ReverseLogisticsIntent,
): readonly CampusLocationId[] {
  const rule = REVERSE_LOGISTICS_RULES[intent] ?? REVERSE_LOGISTICS_RULES.unknown

  return [rule.primary, ...rule.alternatives]
}

function normalizeText(text: string | null | undefined): string {
  return text?.trim().toLowerCase() ?? ''
}

function matchesAny(text: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => matchesTerm(text, token))
}

function matchesTerm(text: string, token: string): boolean {
  const tokenPattern = token
    .trim()
    .split(/\s+/)
    .map(escapeRegExp)
    .join('[^a-z0-9]+')

  if (!tokenPattern) {
    return false
  }

  return new RegExp(`(^|[^a-z0-9])${tokenPattern}([^a-z0-9]|$)`, 'i').test(
    text,
  )
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildDestinationOption(
  locationId: CampusLocationId,
  rule: ReverseLogisticsRule,
): ReverseLogisticsDestinationOption {
  const location = requireCampusLocation(locationId)

  return {
    locationId,
    label: location.name,
    reason:
      rule.reasonByLocation[locationId] ??
      'Campus routing option for this reverse-logistics request.',
    mapUrl: location.concept3d.url,
    mapTextFallback: buildTextMapFallback(location),
  }
}

function requireCampusLocation(locationId: CampusLocationId): CampusLocation {
  const location = getCampusLocation(locationId)

  if (!location) {
    throw new Error(`Missing canonical campus location: ${locationId}`)
  }

  return location
}
