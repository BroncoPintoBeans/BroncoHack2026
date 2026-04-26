import type { InMemoryStore } from "./types";

function makeEmptyStore(): InMemoryStore {
  return {
    cases: new Map(),
    case_runs: new Map(),
    diagnoses: new Map(),
    verdicts: new Map(),
    action_plans: new Map(),
    case_events: new Map(),
    helper_routing_results: new Map(),
    helper_requests: new Map(),
    helper_request_offers: new Map(),
    conversations: new Map(),
    conversation_participants: new Map(),
    messages: new Map(),
  };
}

export const store: InMemoryStore = makeEmptyStore();

export function resetStore(): void {
  store.cases.clear();
  store.case_runs.clear();
  store.diagnoses.clear();
  store.verdicts.clear();
  store.action_plans.clear();
  store.case_events.clear();
  store.helper_routing_results.clear();
  store.helper_requests.clear();
  store.helper_request_offers.clear();
  store.conversations.clear();
  store.conversation_participants.clear();
  store.messages.clear();
}
