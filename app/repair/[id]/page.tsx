"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useCaseRun } from "@/hooks/useCaseRun";
import { useFollowUp } from "@/hooks/useFollowUp";
import { startRun } from "@/lib/api/client";
import { BroncoAssistant } from "@/components/BroncoAssistant";
import Navbar from "@/components/Navbar";
import type { CaseEventRecord } from "@/lib/types/case";
import type { AgentPhase } from "@/lib/types/agents";
import type { RrrBreakdown } from "@/lib/types/payloads";

const macbookImg = "https://www.figma.com/api/mcp/asset/28faa150-d788-4f69-9b8c-8183d40e0a95";

type AgentDisplayStatus = "COMPLETE" | "ANALYZING" | "WAITING" | "FAILED" | "QUEUED";

function getPhaseStatus(phase: AgentPhase, events: CaseEventRecord[]): AgentDisplayStatus {
  const latest = [...events]
    .filter((e) => e.phase === phase)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  if (!latest) return "QUEUED";
  if (latest.status === "complete") return "COMPLETE";
  if (latest.status === "failed") return "FAILED";
  if (latest.status === "awaiting_user") return "WAITING";
  return "ANALYZING";
}

const AGENT_DEFS: { phase: AgentPhase; name: string }[] = [
  { phase: "intake", name: "INTAKE AGENT" },
  { phase: "diagnosis", name: "DIAGNOSIS AGENT" },
  { phase: "economics", name: "ECONOMICS AGENT" },
  { phase: "action_plan", name: "ACTION PLAN AGENT" },
];

const AGENT_STATUS_STYLE: Record<
  AgentDisplayStatus,
  { statusBg: string; statusText: string; border: string; bg: string; detail: string; detailColor: string }
> = {
  COMPLETE: {
    statusBg: "#c1ecd4", statusText: "#274e3d",
    border: "border-[#e2e3db]", bg: "bg-white",
    detail: "Completed", detailColor: "#717973",
  },
  ANALYZING: {
    statusBg: "#ffdcbd", statusText: "#623f18",
    border: "border-2 border-[#ffdcbd]", bg: "bg-white",
    detail: "Processing...", detailColor: "#414844",
  },
  WAITING: {
    statusBg: "#ffdcbd", statusText: "#623f18",
    border: "border-2 border-[#ffdcbd]", bg: "bg-white",
    detail: "Awaiting response", detailColor: "#414844",
  },
  FAILED: {
    statusBg: "#fecaca", statusText: "#7f1d1d",
    border: "border-[#e2e3db]", bg: "bg-white",
    detail: "Failed", detailColor: "#717973",
  },
  QUEUED: {
    statusBg: "#e2e3db", statusText: "#414844",
    border: "border-[#e2e3db]", bg: "bg-[#edefe7] opacity-70",
    detail: "Queued", detailColor: "#717973",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  electronics: "Electronics",
  clothing: "Clothing",
  furniture: "Furniture",
  misc: "Misc",
  laptop: "Laptop",
  bicycle: "Bicycle",
  scooter: "Scooter",
  mini_fridge: "Mini Fridge",
};

const VERDICT_LABELS: Record<string, string> = {
  repair_now: "Repair Now",
  repair_if_cheap: "Repair If Cheap",
  wait_monitor: "Wait & Monitor",
  replace_soon: "Replace Soon",
  replace_now: "Replace Now",
};

const VERDICT_COLORS: Record<string, string> = {
  repair_now: "#274e3d",
  repair_if_cheap: "#2d6e4e",
  wait_monitor: "#614900",
  replace_soon: "#7d3a00",
  replace_now: "#7f1d1d",
};

const RUN_STATUS_LABELS: Record<string, string> = {
  running: "Analyzing Case",
  awaiting_user: "Awaiting Response",
  complete: "Verdict Ready",
  failed: "Analysis Failed",
};

const CASE_STATUS_LABELS: Record<string, string> = {
  open: "Not Started",
  running: "Analyzing Case",
  awaiting_user: "Awaiting Response",
  complete: "Verdict Ready",
  failed: "Analysis Failed",
};

function breakdownRows(bd: RrrBreakdown) {
  return [
    { label: "Diagnosis Confidence", weight: "35%", value: bd.diagnosisConfidence },
    { label: "Cost Factor", weight: "25%", value: bd.costFactor },
    { label: "Effort Factor", weight: "20%", value: bd.effortFactor },
    { label: "Parts Availability", weight: "10%", value: bd.partAvailability },
    { label: "Urgency Factor", weight: "10%", value: bd.urgencyFactor },
  ];
}

function RepairGuidePage() {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[1080px] mx-auto px-6 py-10 flex flex-col gap-8">
        <section className="bg-white border border-[#e2e3db] rounded-xl p-8 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
          <div className="max-w-3xl">
            <p className="text-[#717973] text-sm font-semibold tracking-[0.8px] uppercase">Repair Guide</p>
            <h1 className="font-bold text-[#012d1d] text-[40px] tracking-tight mt-3">How the Agent Verdict Works</h1>
            <p className="text-[#414844] text-lg leading-8 mt-4">
              Bronco Repair Desk turns your item details and photos into a repair verdict, action plan, and community-ready helper summary.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: "1. Add Evidence",
              body: "Describe the problem, add up to three photos, and include any model or quote details you already have.",
            },
            {
              title: "2. Agents Review",
              body: "Diagnosis, cost, safety, and action-plan agents evaluate the case. If needed, Billy asks only constrained follow-up questions.",
            },
            {
              title: "3. Get a Report",
              body: "The final report gives a repair-or-replace verdict, score breakdown, safety notes, and next steps.",
            },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-[#e2e3db] rounded-xl p-5 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
              <h2 className="font-semibold text-[#1a1c18] text-lg">{item.title}</h2>
              <p className="text-[#414844] text-sm leading-6 mt-3">{item.body}</p>
            </div>
          ))}
        </section>

        <section className="bg-[#f3f4ec] border border-[#e2e3db] rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="font-semibold text-[#1a1c18] text-xl">Ready to generate a repair report?</h2>
            <p className="text-[#717973] text-sm mt-2">Start a new repair case and Billy will generate the report from your item details.</p>
          </div>
          <Link
            href="/repair/new"
            className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-6 py-3 rounded-lg hover:bg-[#012d1d] transition-colors"
          >
            + New Repair Case
          </Link>
        </section>
      </main>
    </div>
  );
}

export default function RepairWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");

  if (id === "case-84920") {
    return <RepairGuidePage />;
  }

  return <RepairWorkspaceContent id={id} />;
}

function RepairWorkspaceContent({ id }: { id: string }) {
  const { snapshot, events, isLoading, error: caseRunError } = useCaseRun(id);
  const runId = snapshot?.currentRun?.id ?? "";
  const followUp = useFollowUp(id, runId);
  const report = snapshot?.report;
  const reportVerdict = report?.reportJson.verdict ?? snapshot?.verdict;
  const reportActionPlan = report?.reportJson.actionPlan ?? snapshot?.actionPlan;
  const caseImageUrl = snapshot?.media.find((item) => item.mediaType === "image" && item.url)?.url ?? macbookImg;
  const runStatus = snapshot?.currentRun?.status;
  const isComplete = runStatus === "complete";
  const isAwaitingUser = runStatus === "awaiting_user";

  // Auto-trigger a run when the case is open with no active run yet
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (hasStartedRef.current) return;
    if (!snapshot) return;
    const caseStatus = snapshot.case.status;
    const currentRunStatus = snapshot.currentRun?.status;
    if (caseStatus === "open" && !currentRunStatus) {
      hasStartedRef.current = true;
      startRun(id).catch(() => {
        // ignore 409 (already active) and other transient errors; polling will pick up state
      });
    }
  }, [snapshot, id]);

  const intakeComplete = getPhaseStatus("intake", events) === "COMPLETE";
  const steps = [
    {
      label: "EVIDENCE RECEIVED",
      sub: intakeComplete ? "Intake completed" : "Processing...",
      done: intakeComplete,
      active: !intakeComplete && events.some((e) => e.phase === "intake"),
    },
    {
      label: "AGENT ORCHESTRATION",
      sub: isComplete
        ? "Agents completed"
        : runStatus === "running" || isAwaitingUser
          ? "Diagnosing root cause..."
          : "Waiting for agents",
      done: isComplete,
      active: (runStatus === "running" || isAwaitingUser) && intakeComplete,
    },
    {
      label: "SYNTHESIZING VERDICT",
      sub: isComplete ? "Verdict ready" : "Waiting for agents",
      done: isComplete,
      active: false,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f9faf2]">
        <Navbar />
        <div className="flex min-h-[320px] items-center justify-center">
          <span className="text-[#414844] text-base">Loading case...</span>
        </div>
      </div>
    );
  }

  const caseTitle = snapshot
    ? (CATEGORY_LABELS[snapshot.case.category] ?? snapshot.case.category)
    : "Item";
  const caseShortId = (snapshot?.case.id ?? id).slice(0, 5).toUpperCase();
  const statusLabel = runStatus
    ? (RUN_STATUS_LABELS[runStatus] ?? "Processing")
    : (CASE_STATUS_LABELS[snapshot?.case.status ?? "open"] ?? "Not Started");

  return (
    <div className="min-h-screen bg-[#f9faf2] flex flex-col">
      <Navbar />
      <div className="border-b border-[#e2e3db] bg-[#f9faf2]">
        <div className="max-w-[1200px] mx-auto w-full px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#1b4332] text-sm font-semibold hover:underline">
            <span aria-hidden="true">&lt;</span>
            Dashboard
          </Link>
          <div className="bg-[#012d1d] text-white text-sm px-4 py-2 rounded-lg">Case #{caseShortId}</div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full px-8 py-4 flex flex-col gap-8 pb-16">
        {caseRunError && (
          <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-lg px-4 py-3 text-[#881337] text-sm">
            Failed to load case data: {caseRunError.message}
          </div>
        )}

        {/* Case Summary */}
        <div className="bg-white border border-[#e2e3db] rounded-xl p-5 flex items-center gap-6 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
          <div className="w-32 h-32 border border-[#e2e3db] rounded-lg overflow-hidden shrink-0">
            <img src={caseImageUrl} alt={caseTitle} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <h2 className="font-semibold text-[#1a1c18] text-base">{caseTitle}</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7d562d]" />
              <span className="text-[#414844] text-base">Status: <span className="font-semibold">{statusLabel}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#414844" strokeWidth="1.2"/><path d="M7.5 5v3l2 1" stroke="#414844" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="text-[#414844] text-base">Symptoms: {snapshot?.case.symptoms ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Follow-up card — only shown when awaiting_user */}
        {isAwaitingUser && (
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-[#1a1c18] text-base px-2">Billy needs a little more info</h3>
            <div className="bg-white border border-[#e2e3db] rounded-xl shadow-[0px_4px_10px_rgba(27,67,50,0.04)] overflow-hidden">
              {/* Header with Billy + question */}
              <div className="bg-[#f3f4ec] px-6 pt-5 pb-4 flex items-end gap-4">
                <BroncoAssistant
                  runStatus="awaiting_user"
                  currentPhase={snapshot?.currentRun?.currentPhase}
                  className="shrink-0"
                />
                <div className="flex flex-col gap-2 pb-2 flex-1">
                  <div className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#012d1d" strokeWidth="1.3"/><path d="M7 4.5v3M7 9h.01" stroke="#012d1d" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    <span className="text-[#012d1d] text-xs tracking-[0.7px] uppercase">Diagnosis Agent Question</span>
                  </div>
                  <p className="font-semibold text-[#1a1c18] text-base leading-snug">
                    {snapshot?.currentRun?.awaitingQuestion ?? "Please provide more information."}
                  </p>
                  <p className="text-[#717973] text-sm">Tap an answer below — no free text to keep things safe and fast.</p>
                </div>
              </div>

              {/* Constrained answer options */}
              <div className="px-6 py-5 flex flex-wrap gap-3">
                {(snapshot?.currentRun?.awaitingOptions ?? ["Yes", "No", "Not sure"]).map((option) => (
                  <button
                    key={option}
                    disabled={followUp.isSubmitting}
                    onClick={() => followUp.submit(option)}
                    className="group relative bg-white border-2 border-[#e2e3db] text-[#1a1c18] text-sm font-medium px-5 h-11 rounded-xl hover:border-[#012d1d] hover:bg-[#f3f4ec] hover:text-[#012d1d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {followUp.isSubmitting ? (
                      <svg className="animate-spin w-3.5 h-3.5 opacity-50" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-[#c1c8c2] group-hover:border-[#012d1d] flex items-center justify-center transition-colors shrink-0">
                        <span className="w-2 h-2 rounded-full bg-[#012d1d] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                    )}
                    {option}
                  </button>
                ))}
              </div>

              {followUp.error && (
                <div className="px-6 pb-5 text-sm text-[#991b1b] bg-red-50 mx-6 mb-5 rounded-lg px-4 py-2">
                  Could not submit: {followUp.error.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Billy Bronco — mascot advisor */}
        <div className="bg-white border border-[#e2e3db] rounded-xl px-6 py-3 shadow-[0px_4px_10px_rgba(27,67,50,0.04)] flex items-center justify-between">
          <BroncoAssistant
            runStatus={runStatus ?? (snapshot?.case.status as "open" | undefined)}
            currentPhase={snapshot?.currentRun?.currentPhase}
          />
          <div className="hidden sm:flex flex-col items-end gap-1 pr-2">
            <span className="text-[#717973] text-xs uppercase tracking-[0.6px]">Your Advisor</span>
            <span className="font-semibold text-[#1a1c18] text-sm">Billy Bronco</span>
            <span className="text-[#717973] text-xs">Repair Intelligence</span>
          </div>
        </div>

        {/* Main Workspace: Sidebar + Board */}
        <div className="flex gap-10">
          {/* Progress Sidebar */}
          <aside className="w-64 shrink-0 flex flex-col gap-6">
            <h3 className="font-semibold text-[#1a1c18] text-base px-2">Progress</h3>
            <div className="relative flex flex-col gap-6 px-2">
              <div className="absolute left-[19px] top-4 bottom-8 w-0.5 bg-[#e2e3db]" />
              {steps.map((step) => (
                <div key={step.label} className="flex gap-4 items-start relative z-10">
                  <div className="pt-0.5 w-6 shrink-0">
                    {step.done ? (
                      <div className="w-6 h-6 rounded-full bg-[#012d1d] flex items-center justify-center shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 3L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    ) : step.active ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#7d562d] bg-[#f9faf2] flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-[#7d562d]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-[#e2e3db] bg-[#f9faf2]" />
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-base uppercase leading-6 ${step.active ? "text-[#7d562d]" : step.done ? "text-[#1a1c18]" : "text-[#717973]"}`}>{step.label}</span>
                    <span className={`text-base leading-6 ${step.active ? "text-[#414844]" : step.done ? "text-[#717973]" : "text-[#c1c8c2]"}`}>{step.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Agent Board */}
          <div className="flex-1 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-[#1a1c18] text-base px-2">Agent Review Board</h3>
              <div className="grid grid-cols-2 gap-4">
                {AGENT_DEFS.map(({ phase, name }) => {
                  const agentStatus = getPhaseStatus(phase, events);
                  const style = AGENT_STATUS_STYLE[agentStatus];
                  return (
                    <div key={name} className={`${style.bg} border ${style.border} rounded-lg p-5 flex flex-col gap-4 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]`}>
                      <div className="flex items-start justify-between">
                        <span className="text-[#1a1c18] text-base tracking-[0.8px] uppercase">{name}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded font-normal" style={{ backgroundColor: style.statusBg, color: style.statusText }}>{agentStatus}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#7d562d]" />
                        <span className="text-base leading-6" style={{ color: style.detailColor }}>{style.detail}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Recommendation */}
            <div className="flex flex-col gap-4 pt-4">
              <h3 className="font-semibold text-[#1a1c18] text-base px-2">Final Recommendation</h3>
              {isComplete && reportVerdict ? (
                <div className="bg-white border border-[#e2e3db] rounded-xl p-6 flex flex-col gap-5 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
                  {report ? (
                    <div className="bg-[#f3f4ec] rounded-lg px-4 py-3 text-sm text-[#414844]">
                      Canonical report saved as #{report.id.slice(0, 8).toUpperCase()}.
                    </div>
                  ) : null}
                  {reportActionPlan?.safetyPreamble && (
                    <div className="bg-[#fff8e7] border border-[#ffdcbd] rounded-lg px-4 py-3 flex gap-2 items-start">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5"><path d="M8 1.5L1 14.5h14L8 1.5z" stroke="#623f18" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 6v4M8 11.5h.01" stroke="#623f18" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      <span className="text-sm text-[#623f18] leading-5">{reportActionPlan.safetyPreamble}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#717973] text-xs uppercase tracking-[0.8px]">RRR Score</div>
                      <div className="text-4xl font-bold text-[#1a1c18] mt-1">{(reportVerdict.rrrScore * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#717973] text-xs uppercase tracking-[0.8px]">Verdict</div>
                      <div className="text-xl font-semibold mt-1" style={{ color: VERDICT_COLORS[reportVerdict.label] ?? "#1a1c18" }}>
                        {VERDICT_LABELS[reportVerdict.label] ?? reportVerdict.label}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#e2e3db] pt-4 flex flex-col gap-2.5">
                    {breakdownRows(reportVerdict.breakdown).map((row) => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className="text-[#717973] text-sm">{row.label} <span className="text-[#c1c8c2]">({row.weight})</span></span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-[#e2e3db] rounded-full overflow-hidden">
                            <div className="h-full bg-[#012d1d] rounded-full" style={{ width: `${Math.round(row.value * 100)}%` }} />
                          </div>
                          <span className="text-sm font-medium text-[#1a1c18] w-8 text-right">{Math.round(row.value * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#f3f4ec] rounded-lg px-4 py-3 text-sm text-[#414844] leading-5">
                    <span className="font-medium text-[#1a1c18]">Note: </span>{reportVerdict.uncertaintyNote}
                  </div>
                  {reportActionPlan?.steps.length ? (
                    <div className="border-t border-[#e2e3db] pt-4 flex flex-col gap-3">
                      <div className="text-[#717973] text-xs uppercase tracking-[0.8px]">Action Plan</div>
                      <div className="grid gap-2">
                        {reportActionPlan.steps.map((step) => (
                          <div key={step.order} className="bg-[#f9faf2] border border-[#e2e3db] rounded-lg px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-semibold text-[#1a1c18] text-sm">{step.order}. {step.title}</span>
                              <span className="text-[10px] uppercase rounded bg-[#e2e3db] text-[#414844] px-2 py-0.5">{step.difficulty}</span>
                            </div>
                            <p className="text-[#414844] text-sm mt-1 leading-5">{step.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="bg-[rgba(249,250,242,0.5)] border-2 border-dashed border-[#c1c8c2] rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] gap-3">
                  <div className="w-12 h-12 bg-[#e8e9e1] rounded-full flex items-center justify-center">
                    <svg width="16" height="21" viewBox="0 0 16 21" fill="none"><rect x="1" y="1" width="14" height="19" rx="3" stroke="#717973" strokeWidth="1.5"/><path d="M5 8h6M5 12h4" stroke="#717973" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <h4 className="font-semibold text-[#717973] text-base text-center">Verdict Locked</h4>
                  <p className="text-[#c1c8c2] text-base text-center max-w-[448px] leading-6">
                    The final recommendation and repair action plan will be generated once all agents have completed their analysis.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
