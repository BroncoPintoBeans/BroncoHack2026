import { z } from 'zod'
import {
  InsufficientTokensError,
  RedemptionNotFoundError,
  redeemFoodReward,
} from '@/lib/db/queries/rewards'

export const dynamic = 'force-dynamic'

const redeemRewardSchema = z.object({
  userId: z.string().optional(),
  redemptionId: z.string().min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = redeemRewardSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid redemption payload', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await redeemFoodReward(parsed.data)
    return Response.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof RedemptionNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof InsufficientTokensError) {
      return Response.json({ error: error.message }, { status: 409 })
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to redeem reward' },
      { status: 500 },
    )
  }
}
