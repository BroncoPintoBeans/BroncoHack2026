import { z } from 'zod'
import { awardReward, RewardRuleNotFoundError } from '@/lib/db/queries/rewards'

export const dynamic = 'force-dynamic'

const earnRewardSchema = z.object({
  userId: z.string().optional(),
  actionId: z.string().min(1),
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = earnRewardSchema.safeParse(body)

  if (!parsed.success) {
    return Response.json({ error: 'Invalid reward payload', details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await awardReward(parsed.data)
    return Response.json(result, { status: result.duplicate ? 200 : 201 })
  } catch (error) {
    if (error instanceof RewardRuleNotFoundError) {
      return Response.json({ error: error.message }, { status: 404 })
    }

    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to award reward' },
      { status: 500 },
    )
  }
}
