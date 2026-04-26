import { describe, expect, it } from 'vitest'
import {
  awardReward,
  getRewardSummary,
  redeemFoodReward,
  RewardRuleNotFoundError,
} from '../../lib/db/queries/rewards'
import { BASE_TOKEN_BALANCE } from '../../lib/rewards/data'

describe('rewards backend', () => {
  it('summarizes the demo token balance and configured rewards', async () => {
    const summary = await getRewardSummary(`summary-user-${crypto.randomUUID()}`)

    expect(summary.balance).toBe(BASE_TOKEN_BALANCE)
    expect(summary.earnRules.length).toBeGreaterThan(0)
    expect(summary.foodRedemptions.some(reward => reward.vendor === 'Panda Express')).toBe(true)
    expect(summary.activity.length).toBeGreaterThan(0)
  })

  it('awards a reward once per source', async () => {
    const userId = `award-user-${crypto.randomUUID()}`

    const first = await awardReward({
      userId,
      actionId: 'recycle-dropoff',
      sourceType: 'dropoff',
      sourceId: 'battery-bin-1',
    })
    const second = await awardReward({
      userId,
      actionId: 'recycle-dropoff',
      sourceType: 'dropoff',
      sourceId: 'battery-bin-1',
    })

    expect(first.duplicate).toBe(false)
    expect(first.entry.tokens).toBe(80)
    expect(first.summary.balance).toBe(BASE_TOKEN_BALANCE + 80)
    expect(first.summary.claimedActionIds).toContain('recycle-dropoff')
    expect(second.duplicate).toBe(true)
    expect(second.summary.balance).toBe(BASE_TOKEN_BALANCE + 80)
  })

  it('redeems food rewards and returns a meal pass', async () => {
    const userId = `redeem-user-${crypto.randomUUID()}`

    const result = await redeemFoodReward({ userId, redemptionId: 'env-caffee' })

    expect(result.entry.tokens).toBe(-160)
    expect(result.summary.balance).toBe(BASE_TOKEN_BALANCE - 160)
    expect(result.pass.vendor).toBe('ENV Caffee')
    expect(result.pass.code).toMatch(/^BT-ENV-CAFFEE-/)
  })

  it('rejects unknown earn actions', async () => {
    await expect(
      awardReward({ userId: `bad-action-${crypto.randomUUID()}`, actionId: 'not-real' }),
    ).rejects.toBeInstanceOf(RewardRuleNotFoundError)
  })
})
