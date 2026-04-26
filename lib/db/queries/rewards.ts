import { isSupabaseAvailable, getSupabaseClient } from '../client'
import { demoStore } from '../demo-store'
import {
  BASE_TOKEN_BALANCE,
  DEFAULT_REWARD_USER_ID,
  EARN_RULES,
  FOOD_REDEMPTIONS,
  RECENT_REWARD_ACTIVITY,
  type FoodRedemption,
  type RewardAwardResult,
  type RewardLedgerRecord,
  type RewardRedemptionResult,
  type RewardSummary,
} from '../../rewards/data'

export class RewardRuleNotFoundError extends Error {
  constructor(actionId: string) {
    super(`Reward action ${actionId} is not configured`)
    this.name = 'RewardRuleNotFoundError'
  }
}

export class RedemptionNotFoundError extends Error {
  constructor(redemptionId: string) {
    super(`Food redemption ${redemptionId} is not configured`)
    this.name = 'RedemptionNotFoundError'
  }
}

export class InsufficientTokensError extends Error {
  constructor(requiredTokens: number, balance: number) {
    super(`Need ${requiredTokens} tokens but only ${balance} are available`)
    this.name = 'InsufficientTokensError'
  }
}

export function normalizeRewardUserId(userId?: string | null): string {
  const trimmed = userId?.trim()
  return trimmed || DEFAULT_REWARD_USER_ID
}

function dbRowToRewardLedgerRecord(row: Record<string, unknown>): RewardLedgerRecord {
  return {
    id: String(row.id),
    userId: row.user_id as string,
    actionId: row.action_id as string,
    kind: row.kind as RewardLedgerRecord['kind'],
    label: row.label as string,
    detail: row.detail as string,
    tokens: row.tokens as number,
    sourceType: (row.source_type as string | null) ?? undefined,
    sourceId: (row.source_id as string | null) ?? undefined,
    metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
    createdAt: row.created_at as string,
  }
}

function ledgerEntryToActivity(entry: RewardLedgerRecord) {
  const date = new Date(entry.createdAt)
  return {
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    tokens: entry.tokens,
    date: Number.isNaN(date.getTime())
      ? 'Today'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    kind: entry.kind,
  }
}

async function listRewardLedger(userId: string): Promise<RewardLedgerRecord[]> {
  if (isSupabaseAvailable()) {
    const { data: rows, error } = await (await getSupabaseClient())
      .from('reward_ledger')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (rows ?? []).map(row => dbRowToRewardLedgerRecord(row as Record<string, unknown>))
  }

  return [...(demoStore.rewardLedger.get(userId) ?? [])]
}

async function findDuplicateLedgerEntry(data: {
  userId: string
  actionId: string
  sourceType?: string
  sourceId?: string
}): Promise<RewardLedgerRecord | null> {
  if (isSupabaseAvailable()) {
    let query = (await getSupabaseClient())
      .from('reward_ledger')
      .select()
      .eq('user_id', data.userId)
      .eq('action_id', data.actionId)
      .gt('tokens', 0)
      .limit(1)

    if (data.sourceId) {
      query = query.eq('source_type', data.sourceType ?? '').eq('source_id', data.sourceId)
    } else {
      query = query.is('source_id', null)
    }

    const { data: rows, error } = await query
    if (error) throw error
    const row = rows?.[0]
    return row ? dbRowToRewardLedgerRecord(row as Record<string, unknown>) : null
  }

  const ledger = demoStore.rewardLedger.get(data.userId) ?? []
  return ledger.find((entry) => {
    if (entry.actionId !== data.actionId || entry.tokens <= 0) return false
    if (data.sourceId) {
      return entry.sourceId === data.sourceId && entry.sourceType === data.sourceType
    }
    return !entry.sourceId
  }) ?? null
}

async function insertRewardLedgerEntry(entry: RewardLedgerRecord): Promise<RewardLedgerRecord> {
  if (isSupabaseAvailable()) {
    const { data: row, error } = await (await getSupabaseClient())
      .from('reward_ledger')
      .insert({
        id: entry.id,
        user_id: entry.userId,
        action_id: entry.actionId,
        kind: entry.kind,
        label: entry.label,
        detail: entry.detail,
        tokens: entry.tokens,
        source_type: entry.sourceType ?? null,
        source_id: entry.sourceId ?? null,
        metadata: entry.metadata ?? {},
        created_at: entry.createdAt,
      })
      .select()
      .single()
    if (error) throw error
    return dbRowToRewardLedgerRecord(row as Record<string, unknown>)
  }

  const ledger = demoStore.rewardLedger.get(entry.userId) ?? []
  demoStore.rewardLedger.set(entry.userId, [entry, ...ledger])
  return entry
}

export async function getRewardSummary(userIdInput?: string | null): Promise<RewardSummary> {
  const userId = normalizeRewardUserId(userIdInput)
  const ledger = await listRewardLedger(userId)
  const balance = BASE_TOKEN_BALANCE + ledger.reduce((total, entry) => total + entry.tokens, 0)
  const positiveLedger = ledger.filter(entry => entry.tokens > 0)
  const earnedThisMonth =
    RECENT_REWARD_ACTIVITY.reduce((total, item) => total + item.tokens, 0) +
    positiveLedger.reduce((total, entry) => total + entry.tokens, 0)
  const nextRedemption = FOOD_REDEMPTIONS
    .filter(reward => reward.tokens > balance)
    .sort((a, b) => a.tokens - b.tokens)[0]

  return {
    userId,
    balance,
    earnedThisMonth,
    actionsLogged: RECENT_REWARD_ACTIVITY.length + positiveLedger.length,
    claimedActionIds: positiveLedger.map(entry => entry.actionId),
    nextRedemption,
    activity: [...ledger.map(ledgerEntryToActivity), ...RECENT_REWARD_ACTIVITY].slice(0, 8),
    earnRules: EARN_RULES,
    foodRedemptions: FOOD_REDEMPTIONS,
  }
}

export async function awardReward(data: {
  userId?: string | null
  actionId: string
  sourceType?: string
  sourceId?: string
  metadata?: Record<string, unknown>
}): Promise<RewardAwardResult> {
  const userId = normalizeRewardUserId(data.userId)
  const rule = EARN_RULES.find(item => item.id === data.actionId)
  if (!rule) {
    throw new RewardRuleNotFoundError(data.actionId)
  }

  const duplicate = await findDuplicateLedgerEntry({
    userId,
    actionId: data.actionId,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
  })

  if (duplicate) {
    return {
      entry: duplicate,
      summary: await getRewardSummary(userId),
      duplicate: true,
    }
  }

  const entry = await insertRewardLedgerEntry({
    id: crypto.randomUUID(),
    userId,
    actionId: rule.id,
    kind: rule.kind,
    label: rule.title,
    detail: rule.impact,
    tokens: rule.tokens,
    sourceType: data.sourceType,
    sourceId: data.sourceId,
    metadata: data.metadata,
    createdAt: new Date().toISOString(),
  })

  return {
    entry,
    summary: await getRewardSummary(userId),
    duplicate: false,
  }
}

function buildMealPassCode(redemption: FoodRedemption, entry: RewardLedgerRecord): string {
  return `BT-${redemption.id.toUpperCase()}-${entry.id.slice(0, 8).toUpperCase()}`
}

export async function redeemFoodReward(data: {
  userId?: string | null
  redemptionId: string
}): Promise<RewardRedemptionResult> {
  const userId = normalizeRewardUserId(data.userId)
  const redemption = FOOD_REDEMPTIONS.find(item => item.id === data.redemptionId)
  if (!redemption) {
    throw new RedemptionNotFoundError(data.redemptionId)
  }

  const before = await getRewardSummary(userId)
  if (before.balance < redemption.tokens) {
    throw new InsufficientTokensError(redemption.tokens, before.balance)
  }

  const entry = await insertRewardLedgerEntry({
    id: crypto.randomUUID(),
    userId,
    actionId: redemption.id,
    kind: 'redeem',
    label: redemption.vendor,
    detail: redemption.offer,
    tokens: -redemption.tokens,
    sourceType: 'food_redemption',
    sourceId: redemption.id,
    metadata: { location: redemption.location, category: redemption.category },
    createdAt: new Date().toISOString(),
  })

  return {
    entry,
    summary: await getRewardSummary(userId),
    pass: {
      code: buildMealPassCode(redemption, entry),
      vendor: redemption.vendor,
      offer: redemption.offer,
      location: redemption.location,
    },
  }
}
