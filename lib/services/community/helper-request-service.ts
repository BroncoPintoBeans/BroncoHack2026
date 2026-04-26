import { randomUUID } from "crypto";
import { store } from "@/lib/db/community/store";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { buildContextSnapshot } from "./context-snapshot";
import { getLatestCaseReportOrThrow } from "@/lib/db/queries/reports";
import type { HelperRequestDetail } from "@/lib/types/community";
import type { CaseEventRow } from "@/lib/db/community/types";

const TERMINAL_STATUSES = new Set([
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
]);

export interface EscalateBody {
  report_id?: string;
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

export async function escalateToHelperRequest(
  caseId: string,
  userId: string,
  body: EscalateBody
): Promise<EscalateResult> {
  const existing = helperRequestRepository.findByCase(caseId);
  if (existing) {
    return { helper_request: existing, created: false };
  }

  const caseRow = store.cases.get(caseId);
  if (!caseRow) throw new Error(`case ${caseId} not found`);

  const report = await getLatestCaseReportOrThrow(caseId);
  if (report.userId !== userId || report.caseId !== caseId) {
    throw Object.assign(new Error("report does not belong to this case"), { status: 403 });
  }
  if (!body.report_id || body.report_id !== report.id) {
    throw Object.assign(new Error("report_id is required and must match the completed report"), { status: 422 });
  }

  const runId = report.runId;
  const { diagnosisSnapshot, verdictSnapshot, actionPlanSnapshot } = buildContextSnapshot(caseId, runId);
  const helperTemplate = report.boardSummaryJson.helperRequestTemplate;
  const safetyFlags = report.boardSummaryJson.safetyFlags;

  const created = helperRequestRepository.create({
    case_id: caseId,
    run_id: runId,
    report_id: report.id,
    user_id: userId,
    title: body.title ?? report.boardSummaryJson.title ?? caseRow.title,
    public_summary: body.public_summary ?? report.boardSummaryJson.publicSummary,
    helper_request_template: helperTemplate,
    category: report.boardSummaryJson.category,
    urgency: report.boardSummaryJson.urgency,
    campus_area: body.campus_area ?? null,
    preferred_time: body.preferred_time ?? null,
    skill_tags: body.skill_tags ?? report.boardSummaryJson.skillTags,
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
