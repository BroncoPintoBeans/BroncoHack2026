import { randomUUID } from "crypto";
import { store } from "@/lib/db/community/store";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { buildContextSnapshot } from "./context-snapshot";
import type { HelperRequestDetail } from "@/lib/types/community";
import type { CaseEventRow } from "@/lib/db/community/types";

const TERMINAL_STATUSES = new Set([
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
]);

export interface EscalateBody {
  title?: string;
  public_summary?: string;
  campus_area?: string;
  preferred_time?: string;
  skill_tags?: string[];
  expires_at?: string;
}

export interface EscalateResult {
  helper_request: HelperRequestDetail;
  created: boolean;
}

export function escalateToHelperRequest(
  caseId: string,
  userId: string,
  body: EscalateBody
): EscalateResult {
  const existing = helperRequestRepository.findByCase(caseId);
  if (existing) {
    return { helper_request: existing, created: false };
  }

  const caseRow = store.cases.get(caseId);
  if (!caseRow) throw new Error(`case ${caseId} not found`);

  // Find the latest run for this case
  let latestRun: { id: string; created_at: string } | null = null;
  for (const run of store.case_runs.values()) {
    if (run.case_id === caseId) {
      if (!latestRun || run.created_at > latestRun.created_at) {
        latestRun = run;
      }
    }
  }

  const runId = latestRun?.id ?? null;
  const { diagnosisSnapshot, verdictSnapshot, actionPlanSnapshot } =
    buildContextSnapshot(caseId, runId);

  const helperTemplate =
    typeof actionPlanSnapshot.helper_request_template === "string"
      ? actionPlanSnapshot.helper_request_template
      : null;

  const safetyFlags = Array.isArray(diagnosisSnapshot.safety_flags)
    ? (diagnosisSnapshot.safety_flags as string[])
    : [];

  const created = helperRequestRepository.create({
    case_id: caseId,
    run_id: runId,
    user_id: userId,
    title: body.title ?? caseRow.title,
    public_summary: body.public_summary ?? helperTemplate ?? caseRow.title,
    helper_request_template: helperTemplate,
    category: caseRow.category,
    urgency: caseRow.urgency,
    campus_area: body.campus_area ?? null,
    preferred_time: body.preferred_time ?? null,
    skill_tags: body.skill_tags ?? [],
    safety_flags: safetyFlags,
    diagnosis_snapshot: diagnosisSnapshot as Record<string, unknown>,
    verdict_snapshot: verdictSnapshot as Record<string, unknown>,
    action_plan_snapshot: actionPlanSnapshot as Record<string, unknown>,
    expires_at: body.expires_at ?? null,
  });

  emitCaseEvent(caseId, "helper_request_created", {
    helper_request_id: created.id,
  });

  return { helper_request: created, created: true };
}

export interface UpdateBody {
  title?: string;
  public_summary?: string;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: string[];
  status?:
    | "open"
    | "in_progress"
    | "resolved"
    | "cancelled"
    | "expired"
    | "no_helper_found";
}

export function updateHelperRequest(
  id: string,
  userId: string,
  body: UpdateBody
): HelperRequestDetail {
  const request = helperRequestRepository.findById(id);
  if (!request) throw Object.assign(new Error("not found"), { status: 404 });
  if (request.user_id !== userId)
    throw Object.assign(new Error("forbidden"), { status: 403 });
  if (TERMINAL_STATUSES.has(request.status))
    throw Object.assign(new Error("request is in a terminal state"), {
      status: 409,
    });

  return helperRequestRepository.update(id, body);
}

export function emitCaseEvent(
  caseId: string,
  kind: string,
  payload: Record<string, unknown>
): void {
  const row: CaseEventRow = {
    id: randomUUID(),
    case_id: caseId,
    run_id: null,
    phase: "communal_repair",
    status: kind,
    payload,
    created_at: new Date().toISOString(),
  };
  store.case_events.set(row.id, row);
}
