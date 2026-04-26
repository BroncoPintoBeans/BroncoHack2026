import { randomUUID } from "crypto";
import { store } from "@/lib/db/community/store";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { getCaseReport } from "@/lib/db/queries/reports";
import type { HelperRequestDetail } from "@/lib/types/community";
import type { CaseEventRow } from "@/lib/db/community/types";

const TERMINAL_STATUSES = new Set([
  "resolved",
  "cancelled",
  "expired",
  "no_helper_found",
]);

export interface EscalateBody {
  report_id: string;
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
  const report = await getCaseReport(body.report_id);
  if (!report) {
    throw Object.assign(new Error("completed report not found"), { status: 422 });
  }
  if (report.caseId !== caseId || report.userId !== userId) {
    throw Object.assign(new Error("report does not match this case"), { status: 409 });
  }

  const existing = helperRequestRepository.findByCase(caseId);
  if (existing) {
    return { helper_request: existing, created: false };
  }

  const summary = report.boardSummaryJson;

  const created = helperRequestRepository.create({
    case_id: caseId,
    run_id: report.runId,
    report_id: report.id,
    user_id: userId,
    title: body.title ?? summary.title,
    public_summary: body.public_summary ?? summary.publicSummary,
    helper_request_template: summary.helperRequestTemplate,
    category: summary.category,
    urgency: summary.urgency,
    campus_area: body.campus_area ?? null,
    preferred_time: body.preferred_time ?? null,
    skill_tags: body.skill_tags ?? summary.skillTags,
    safety_flags: summary.safetyFlags,
    verdict_label: summary.verdictLabel,
    rrr_score: summary.rrrScore,
    diagnosis_snapshot: {},
    verdict_snapshot: {},
    action_plan_snapshot: {},
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
