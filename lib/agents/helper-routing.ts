import type { AgentContext } from './context'
import type { CaseRecord } from '../types/case'
import type { HelperRoutingPayload } from '../types/payloads'
import { mockHelperRouting } from './mock-provider'

export async function runHelperRouting(
  ctx: AgentContext,
  _caseRecord: CaseRecord,
): Promise<HelperRoutingPayload> {
  // Stub: always uses mock matches (live technician search is a stretch feature)
  return mockHelperRouting(ctx)
}
