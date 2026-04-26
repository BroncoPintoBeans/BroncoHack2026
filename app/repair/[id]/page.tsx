"use client";
import BackButton from "@/components/BackButton";

const macbookImg = "https://www.figma.com/api/mcp/asset/28faa150-d788-4f69-9b8c-8183d40e0a95";
const macbookDetailImg = "https://www.figma.com/api/mcp/asset/0589ea48-6685-4c4a-b4ce-b2fb659caab5";

const agents = [
  { name: "INTAKE AGENT", status: "COMPLETE", statusBg: "#c1ecd4", statusText: "#274e3d", detail: "Data validated", detailColor: "#717973", border: "border-[#e2e3db]", bg: "bg-white" },
  { name: "DIAGNOSIS AGENT", status: "ANALYZING", statusBg: "#ffdcbd", statusText: "#623f18", detail: "Checking Flexgate history...", detailColor: "#414844", border: "border-2 border-[#ffdcbd]", bg: "bg-white" },
  { name: "ECONOMICS AGENT", status: "WAITING", statusBg: "#e2e3db", statusText: "#414844", detail: "Queued", detailColor: "#717973", border: "border-[#e2e3db]", bg: "bg-[#edefe7] opacity-70" },
  { name: "ACTION PLAN AGENT", status: "WAITING", statusBg: "#e2e3db", statusText: "#414844", detail: "Queued", detailColor: "#717973", border: "border-[#e2e3db]", bg: "bg-[#edefe7] opacity-70" },
];

const steps = [
  { label: "EVIDENCE RECEIVED", sub: "Intake completed", done: true, active: false },
  { label: "AGENT ORCHESTRATION", sub: "Diagnosing root cause...", done: false, active: true },
  { label: "SYNTHESIZING VERDICT", sub: "Waiting for agents", done: false, active: false },
];

export default function RepairWorkspacePage() {
  return (
    <div className="min-h-screen bg-[#f9faf2] flex flex-col">
      {/* Workspace Header */}
      <header className="border-b border-[#e2e3db] px-8 py-4 flex items-center justify-between bg-[#f9faf2]">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/dashboard" label="Back" />
          <span className="font-semibold text-[#1a1c18] text-base">Bronco Repair Desk</span>
        </div>
        <div className="bg-[#012d1d] text-white text-base px-4 py-2 rounded-lg">Case #84920</div>
      </header>

      <div className="max-w-[1200px] mx-auto w-full px-8 py-4 flex flex-col gap-8 pb-16">
        {/* Case Summary */}
        <div className="bg-white border border-[#e2e3db] rounded-xl p-5 flex items-center gap-6 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
          <div className="w-32 h-32 border border-[#e2e3db] rounded-lg overflow-hidden shrink-0">
            <img src={macbookImg} alt="MacBook Pro" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <h2 className="font-semibold text-[#1a1c18] text-base">MacBook Pro 2019</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#7d562d]" />
              <span className="text-[#414844] text-base">Status: <span className="font-semibold">Analyzing Case</span></span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#414844" strokeWidth="1.2"/><path d="M7.5 5v3l2 1" stroke="#414844" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span className="text-[#414844] text-base">Symptoms: Screen flickers when hinge is moved</span>
            </div>
          </div>
        </div>

        {/* Evidence Gathering */}
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-[#1a1c18] text-base px-2">Evidence Gathering</h3>
          <div className="bg-white border border-[#e2e3db] rounded-xl shadow-[0px_4px_10px_rgba(27,67,50,0.04)] overflow-hidden">
            <div className="bg-[#f3f4ec] p-6 flex items-start justify-between gap-6">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-2">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><circle cx="8.5" cy="8.5" r="7.5" stroke="#012d1d" strokeWidth="1.5"/><path d="M8.5 5.5v4M8.5 11h.01" stroke="#012d1d" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="text-[#012d1d] text-base tracking-[0.8px] uppercase font-normal">Follow-Up Question</span>
                </div>
                <h4 className="font-semibold text-[#1a1c18] text-base leading-snug">Does the flicker stop at a specific angle?</h4>
                <p className="text-[#414844] text-base leading-6">The Diagnosis Agent needs this to confirm cable tension issues.</p>
              </div>
              <div className="w-32 h-32 border border-[#c1c8c2] rounded-lg overflow-hidden shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] shrink-0">
                <img src={macbookDetailImg} alt="MacBook detail" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="px-6 py-5 flex gap-3">
              <button className="bg-[#012d1d] text-white text-base px-6 h-10 rounded-lg hover:bg-[#1b4332] transition-colors">Yes</button>
              <button className="bg-[#e2e3db] text-[#1a1c18] text-base px-6 h-10 rounded-lg hover:bg-[#d2d3cb] transition-colors">No</button>
              <button className="bg-[#e2e3db] text-[#1a1c18] text-base px-6 h-10 rounded-lg hover:bg-[#d2d3cb] transition-colors">Intermittent</button>
            </div>
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
                {agents.map((agent) => (
                  <div key={agent.name} className={`${agent.bg} border ${agent.border} rounded-lg p-5 flex flex-col gap-4 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]`}>
                    <div className="flex items-start justify-between">
                      <span className="text-[#1a1c18] text-base tracking-[0.8px] uppercase">{agent.name}</span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded font-normal" style={{ backgroundColor: agent.statusBg, color: agent.statusText }}>{agent.status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7d562d]" />
                      <span className="text-base leading-6" style={{ color: agent.detailColor }}>{agent.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Recommendation */}
            <div className="flex flex-col gap-4 pt-4">
              <h3 className="font-semibold text-[#1a1c18] text-base px-2">Final Recommendation</h3>
              <div className="bg-[rgba(249,250,242,0.5)] border-2 border-dashed border-[#c1c8c2] rounded-xl p-8 flex flex-col items-center justify-center min-h-[200px] gap-3">
                <div className="w-12 h-12 bg-[#e8e9e1] rounded-full flex items-center justify-center">
                  <svg width="16" height="21" viewBox="0 0 16 21" fill="none"><rect x="1" y="1" width="14" height="19" rx="3" stroke="#717973" strokeWidth="1.5"/><path d="M5 8h6M5 12h4" stroke="#717973" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <h4 className="font-semibold text-[#717973] text-base text-center">Verdict Locked</h4>
                <p className="text-[#c1c8c2] text-base text-center max-w-[448px] leading-6">
                  The final recommendation and repair action plan will be generated once all agents have completed their analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
