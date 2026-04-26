import { DEMO_CASES } from '../../tests/fixtures/demo-cases'
import { DEMO_LAPTOP_EVENTS } from '../../tests/fixtures/demo-events'
import type { CaseRecord, CaseRunRecord, CaseEventRecord } from '../types/case'
import type {
  DiagnosisCompletePayload,
  EconomicsPayload,
  ActionPlanPayload,
  HelperRoutingPayload,
} from '../types/payloads'

export interface DemoStore {
  cases: Map<string, CaseRecord>
  runs: Map<string, CaseRunRecord>
  runsByCaseId: Map<string, string>
  events: Map<string, CaseEventRecord[]>
  diagnoses: Map<string, DiagnosisCompletePayload>
  verdicts: Map<string, EconomicsPayload>
  actionPlans: Map<string, ActionPlanPayload>
  helperRequests: Map<string, HelperRoutingPayload>
}

function createStore(): DemoStore {
  const store: DemoStore = {
    cases: new Map(),
    runs: new Map(),
    runsByCaseId: new Map(),
    events: new Map(),
    diagnoses: new Map(),
    verdicts: new Map(),
    actionPlans: new Map(),
    helperRequests: new Map(),
  }

  // Seed cases
  for (const c of DEMO_CASES) {
    store.cases.set(c.id, c)
  }

  // Seed run for case-84920
  const demoRun: CaseRunRecord = {
    id: 'run-84920-01',
    caseId: 'case-84920',
    isCurrent: true,
    status: 'complete',
    currentPhase: 'orchestrator',
    followupCount: 0,
    triggerReason: 'initial',
    startedAt: '2026-04-25T10:00:00Z',
    completedAt: '2026-04-25T10:00:18Z',
  }
  store.runs.set(demoRun.id, demoRun)
  store.runsByCaseId.set('case-84920', demoRun.id)

  // Convert and seed events
  const eventRecords: CaseEventRecord[] = DEMO_LAPTOP_EVENTS.map(e => ({
    id: e.id,
    caseId: e.case_id,
    runId: e.run_id,
    phase: e.phase,
    status: e.status,
    payload: e.payload,
    createdAt: e.created_at,
  }))
  store.events.set('case-84920', eventRecords)

  // Seed diagnosis from evt-84920-05
  const diagEvt = DEMO_LAPTOP_EVENTS.find(e => e.id === 'evt-84920-05')
  if (diagEvt?.payload) {
    store.diagnoses.set('case-84920', diagEvt.payload as DiagnosisCompletePayload)
  }

  // Seed verdict from evt-84920-06
  const econEvt = DEMO_LAPTOP_EVENTS.find(e => e.id === 'evt-84920-06')
  if (econEvt?.payload) {
    store.verdicts.set('case-84920', econEvt.payload as EconomicsPayload)
  }

  // Seed action plan from evt-84920-07
  const planEvt = DEMO_LAPTOP_EVENTS.find(e => e.id === 'evt-84920-07')
  if (planEvt?.payload) {
    store.actionPlans.set('case-84920', planEvt.payload as ActionPlanPayload)
  }

  return store
}

export const demoStore: DemoStore = createStore()
