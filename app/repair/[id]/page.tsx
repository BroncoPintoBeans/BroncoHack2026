"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCaseRun } from "@/hooks/useCaseRun";
import { useFollowUp } from "@/hooks/useFollowUp";
import type { CaseEventRecord } from "@/lib/types/case";
import type { AgentPhase } from "@/lib/types/agents";
import type { RrrBreakdown } from "@/lib/types/payloads";

const macbookImg = "https://www.figma.com/api/mcp/asset/28faa150-d788-4f69-9b8c-8183d40e0a95";
const macbookDetailImg = "https://www.figma.com/api/mcp/asset/0589ea48-6685-4c4a-b4ce-b2fb659caab5";

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

export default function RepairWorkspacePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id ?? "");

  const { snapshot, events, isLoading, error: caseRunError } = useCaseRun(id);
  const runId = snapshot?.currentRun?.id ?? "";
  const followUp = useFollowUp(id, runId);

  const runStatus = snapshot?.currentRun?.status;
  const isComplete = runStatus === "complete";
  const isAwaitingUser = runStatus === "awaiting_user";

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
      <div className="min-h-screen bg-[#f9faf2] flex items-center justify-center">
        <span className="text-[#414844] text-base">Loading case...</span>
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
      {/* Workspace Header */}
      <header className="border-b border-[#e2e3db] px-8 py-4 flex items-center justify-between bg-[#f9faf2]">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 rounded hover:bg-[#e2e3db] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#1a1c18" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <span className="font-semibold text-[#1a1c18] text-base">Bronco Repair Desk</span>
        </div>
        <div className="bg-[#012d1d] text-white text-base px-4 py-2 rounded-lg">Case #{caseShortId}</div>
      </header>

      <div className="max-w-[1200px] mx-auto w-full px-8 py-4 flex flex-col gap-8 pb-16">
        {caseRunError && (
          <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-lg px-4 py-3 text-[#881337] text-sm">
            Failed to load case data: {caseRunError.message}
          </div>
        )}

        {/* Case Summary */}
        <div className="bg-white border border-[#e2e3db] rounded-xl p-5 flex items-center gap-6 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
          <div className="w-32 h-32 border border-[#e2e3db] rounded-lg overflow-hidden shrink-0">
            <img src={macbookImg} alt={caseTitle} className="w-full h-full object-cover" />
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
            <h3 className="font-semibold text-[#1a1c18] text-base px-2">Evidence Gathering</h3>
            <div className="bg-white border border-[#e2e3db] rounded-xl shadow-[0px_4px_10px_rgba(27,67,50,0.04)] overflow-hidden">
              <div className="bg-[#f3f4ec] p-6 flex items-start justify-between gap-6">
                <div className="flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" stroke="#012d1d" strokeWidth="1.5"/><path d="M8.5 5.5v4M8.5 11h.01" stroke="#012d1d" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    <span className="text-[#012d1d] text-base tracking-[0.8px] uppercase font-normal">Follow-Up Question</span>
                  </div>
                  <h4 className="font-semibold text-[#1a1c18] text-base leading-snug">
                    {snapshot?.currentRun?.awaitingQuestion ?? "Please provide more information."}
                  </h4>
                  <p className="text-[#414844] text-base leading-6">The Diagnosis Agent needs this to confirm the issue.</p>
                </div>
                <div className="w-32 h-32 border border-[#c1c8c2] rounded-lg overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0">
                  <img src={macbookDetailImg} alt="Case detail" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="px-6 py-5 flex gap-3">
                <button
                  disabled={followUp.isSubmitting}
                  onClick={() => followUp.submit("yes")}
                  className="bg-[#012d1d] text-white text-base px-6 h-10 rounded-lg hover:bg-[#1b4332] transition-colors disabled:opacity-50"
                >Yes</button>
                <button
                  disabled={followUp.isSubmitting}
                  onClick={() => followUp.submit("no")}
                  className="bg-[#e2e3db] text-[#1a1c18] text-base px-6 h-10 rounded-lg hover:bg-[#d2d3cb] transition-colors disabled:opacity-50"
                >No</button>
                <button
                  disabled={followUp.isSubmitting}
                  onClick={() => followUp.submit("intermittent")}
                  className="bg-[#e2e3db] text-[#1a1c18] text-base px-6 h-10 rounded-lg hover:bg-[#d2d3cb] transition-colors disabled:opacity-50"
                >Intermittent</button>
              </div>
              {followUp.error && (
                <div className="px-6 pb-5 text-sm text-[#991b1b]">
                  Could not submit follow-up: {followUp.error.message}
                </div>
              )}
            </div>
          </div>
        )}

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
              {isComplete && snapshot?.verdict ? (
                <div className="bg-white border border-[#e2e3db] rounded-xl p-6 flex flex-col gap-5 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
                  {snapshot.actionPlan?.safetyPreamble && (
                    <div className="bg-[#fff8e7] border border-[#ffdcbd] rounded-lg px-4 py-3 flex gap-2 items-start">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5"><path d="M8 1.5L1 14.5h14L8 1.5z" stroke="#623f18" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 6v4M8 11.5h.01" stroke="#623f18" strokeWidth="1.4" strokeLinecap="round"/></svg>
                      <span className="text-sm text-[#623f18] leading-5">{snapshot.actionPlan.safetyPreamble}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[#717973] text-xs uppercase tracking-[0.8px]">RRR Score</div>
                      <div className="text-4xl font-bold text-[#1a1c18] mt-1">{(snapshot.verdict.rrrScore * 100).toFixed(0)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#717973] text-xs uppercase tracking-[0.8px]">Verdict</div>
                      <div className="text-xl font-semibold mt-1" style={{ color: VERDICT_COLORS[snapshot.verdict.label] ?? "#1a1c18" }}>
                        {VERDICT_LABELS[snapshot.verdict.label] ?? snapshot.verdict.label}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#e2e3db] pt-4 flex flex-col gap-2.5">
                    {breakdownRows(snapshot.verdict.breakdown).map((row) => (
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
                    <span className="font-medium text-[#1a1c18]">Note: </span>{snapshot.verdict.uncertaintyNote}
                  </div>
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
