import { randomUUID } from "crypto";
import { isSupabaseAvailable, getSupabaseClient } from "@/lib/db/client";
import { store } from "@/lib/db/community/store";
import { helperRequestRepository } from "@/lib/db/community/helper-request-repository";
import { buildContextSnapshot } from "./context-snapshot";
import { getCaseReport } from "@/lib/db/queries/reports";
import { assertNoSupabaseError } from "@/lib/db/queries/validation";
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

export interface ActiveHelperRequestResult {
  helper_request: HelperRequestDetail | null;
}

const ACTIVE_STATUSES = ["draft", "open", "helper_offered", "helper_accepted", "in_progress"];

type SupabaseHelperRequestRow = {
  id: string;
  case_id: string;
  run_id?: string | null;
  report_id?: string | null;
  user_id: string;
  title?: string | null;
  public_summary?: string | null;
  helper_request_template?: string | null;
  category?: string | null;
  urgency?: string | null;
  campus_area?: string | null;
  preferred_time?: string | null;
  skill_tags?: unknown;
  safety_flags?: unknown;
  verdict_label?: string | null;
  rrr_score?: number | string | null;
  status: HelperRequestDetail["status"];
  diagnosis_snapshot?: Record<string, unknown> | null;
  verdict_snapshot?: Record<string, unknown> | null;
  action_plan_snapshot?: Record<string, unknown> | null;
  accepted_offer_id?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string | null;
};

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberOrNull(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowToHelperRequestDetail(
  row: SupabaseHelperRequestRow,
  fallback?: {
    runId?: string;
    title?: string;
    publicSummary?: string;
    helperRequestTemplate?: string;
    category?: string;
    urgency?: string;
    skillTags?: string[];
    safetyFlags?: string[];
    verdictLabel?: string | null;
    rrrScore?: number | null;
  },
): HelperRequestDetail {
  return {
    id: row.id,
    case_id: row.case_id,
    run_id: row.run_id ?? fallback?.runId ?? null,
    report_id: row.report_id ?? null,
    user_id: row.user_id,
    title: row.title ?? fallback?.title ?? "Repair help request",
    public_summary: row.public_summary ?? fallback?.publicSummary ?? "",
    helper_request_template: row.helper_request_template ?? fallback?.helperRequestTemplate ?? null,
    category: row.category ?? fallback?.category ?? "repair",
    urgency: row.urgency ?? fallback?.urgency ?? "normal",
    campus_area: row.campus_area ?? null,
    preferred_time: row.preferred_time ?? null,
    skill_tags: stringArray(row.skill_tags).length ? stringArray(row.skill_tags) : (fallback?.skillTags ?? []),
    safety_flags: stringArray(row.safety_flags).length ? stringArray(row.safety_flags) : (fallback?.safetyFlags ?? []),
    verdict_label: row.verdict_label ?? fallback?.verdictLabel ?? null,
    rrr_score: numberOrNull(row.rrr_score) ?? fallback?.rrrScore ?? null,
    status: row.status,
    diagnosis_snapshot: row.diagnosis_snapshot ?? {},
    verdict_snapshot: row.verdict_snapshot ?? {},
    action_plan_snapshot: row.action_plan_snapshot ?? {},
    accepted_offer_id: row.accepted_offer_id ?? null,
    expires_at: row.expires_at ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? row.created_at,
    pending_offer_count: 0,
  };
}

async function findActiveSupabaseHelperRequest(
  caseId: string,
  fallback: Parameters<typeof rowToHelperRequestDetail>[1],
): Promise<HelperRequestDetail | null> {
  const { data, error } = await (await getSupabaseClient())
    .from("helper_requests")
    .select("*")
    .eq("case_id", caseId)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  assertNoSupabaseError(error, "findActiveSupabaseHelperRequest select");
  return data ? rowToHelperRequestDetail(data as SupabaseHelperRequestRow, fallback) : null;
}

async function createSupabaseHelperRequest(input: {
  caseId: string;
  userId: string;
  reportId: string;
  runId: string;
  body: EscalateBody;
  summary: NonNullable<Awaited<ReturnType<typeof getCaseReport>>>["boardSummaryJson"];
}): Promise<HelperRequestDetail> {
  const { caseId, userId, reportId, runId, body, summary } = input;
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    case_id: caseId,
    run_id: runId,
    report_id: reportId,
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
    status: "open",
    updated_at: now,
  };
  const { data, error } = await (await getSupabaseClient())
    .from("helper_requests")
    .insert(row)
    .select("*")
    .single();
  assertNoSupabaseError(error, "createSupabaseHelperRequest insert");
  if (!data) throw new Error("createSupabaseHelperRequest insert: missing row");
  return rowToHelperRequestDetail(data as SupabaseHelperRequestRow, {
    runId,
    title: row.title,
    publicSummary: row.public_summary,
    helperRequestTemplate: row.helper_request_template,
    category: row.category,
    urgency: row.urgency,
    skillTags: row.skill_tags,
    safetyFlags: row.safety_flags,
    verdictLabel: row.verdict_label,
    rrrScore: row.rrr_score,
  });
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

  const fallback = {
    runId: report.runId,
    title: summary.title,
    publicSummary: summary.publicSummary,
    helperRequestTemplate: summary.helperRequestTemplate,
    category: summary.category,
    urgency: summary.urgency,
    skillTags: summary.skillTags,
    safetyFlags: summary.safetyFlags,
    verdictLabel: summary.verdictLabel,
    rrrScore: summary.rrrScore,
  };
  const { diagnosisSnapshot, verdictSnapshot, actionPlanSnapshot } = buildContextSnapshot(caseId, report.runId);

  if (isSupabaseAvailable()) {
    const existingSupabase = await findActiveSupabaseHelperRequest(caseId, fallback);
    if (existingSupabase) {
      return { helper_request: existingSupabase, created: false };
    }

    const createdSupabase = await createSupabaseHelperRequest({
      caseId,
      userId,
      reportId: report.id,
      runId: report.runId,
      body,
      summary,
    });
    return { helper_request: createdSupabase, created: true };
  }

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

export async function getActiveHelperRequestForCase(
  caseId: string,
  userId: string,
): Promise<ActiveHelperRequestResult> {
  if (isSupabaseAvailable()) {
    const helperRequest = await findActiveSupabaseHelperRequest(caseId, undefined);
    if (helperRequest && helperRequest.user_id !== userId) {
      throw Object.assign(new Error("forbidden"), { status: 403 });
    }
    return { helper_request: helperRequest };
  }

  const helperRequest = helperRequestRepository.findByCase(caseId);
  if (helperRequest && helperRequest.user_id !== userId) {
    throw Object.assign(new Error("forbidden"), { status: 403 });
  }
  return { helper_request: helperRequest };
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
