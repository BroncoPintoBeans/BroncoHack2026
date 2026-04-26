import { describe, expect, it } from 'vitest'
import {
  awardReward,
  getRewardSummary,
  redeemFoodReward,
  InsufficientTokensError,
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

  it('redeems food rewards and returns unique meal passes', async () => {
    const userId = `redeem-user-${crypto.randomUUID()}`

    const first = await redeemFoodReward({ userId, redemptionId: 'env-caffee' })
    const second = await redeemFoodReward({ userId, redemptionId: 'env-caffee' })

    expect(first.entry.tokens).toBe(-160)
    expect(first.summary.balance).toBe(BASE_TOKEN_BALANCE - 160)
    expect(first.pass.vendor).toBe('ENV Caffee')
    expect(first.pass.code).toMatch(/^BT-ENV-CAFFEE-/)
    expect(second.entry.tokens).toBe(-160)
    expect(second.summary.balance).toBe(BASE_TOKEN_BALANCE - 320)
    expect(second.pass.code).not.toBe(first.pass.code)
  })

  it('rejects insufficient redemption balance with a useful error', async () => {
    const userId = `low-balance-user-${crypto.randomUUID()}`

    await redeemFoodReward({ userId, redemptionId: 'panda' })
    await redeemFoodReward({ userId, redemptionId: 'panda' })
    await redeemFoodReward({ userId, redemptionId: 'panda' })

    await expect(redeemFoodReward({ userId, redemptionId: 'panda' })).rejects.toThrow(
      'Need 360 tokens but only 160 are available',
    )
    await expect(redeemFoodReward({ userId, redemptionId: 'panda' })).rejects.toBeInstanceOf(
      InsufficientTokensError,
    )
  })

  it('rejects unknown earn actions', async () => {
    await expect(
      awardReward({ userId: `bad-action-${crypto.randomUUID()}`, actionId: 'not-real' }),
    ).rejects.toBeInstanceOf(RewardRuleNotFoundError)
  })
})
