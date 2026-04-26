import { getRewardSummary } from '@/lib/db/queries/rewards'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const summary = await getRewardSummary(url.searchParams.get('userId'))
    return Response.json(summary)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unable to load rewards' },
      { status: 500 },
    )
  }
}
