import Link from "next/link";
import Navbar from "@/components/Navbar";

const macbookImg = "https://www.figma.com/api/mcp/asset/28faa150-d788-4f69-9b8c-8183d40e0a95";
const bikeImg = "https://www.figma.com/api/mcp/asset/35e5ed29-e59c-4710-a888-21f11a1394a4";
const laptopImg = "https://www.figma.com/api/mcp/asset/60147299-9838-4982-8155-e0593c5b8423";

const cases = [
  { id: "case-84920", title: "MacBook Pro 2019", issue: "Screen flickers when hinge is moved", status: "Analyzing", statusBg: "#ffdcbd", statusText: "#623f18", score: 75, cost: "$15", img: macbookImg, date: "Apr 24, 2024" },
  { id: "case-83141", title: "Vintage Road Bike", issue: "Chain slipping under load, brakes squeaking", status: "Verdict Ready", statusBg: "#c1ecd4", statusText: "#274e3d", score: 90, cost: "$30", img: bikeImg, date: "Apr 18, 2024" },
  { id: "case-81003", title: "Old MacBook Air", issue: "Battery drains in 45 minutes, won't hold charge", status: "Draft", statusBg: "#e2e3db", statusText: "#414844", score: 60, cost: "$85", img: laptopImg, date: "Apr 10, 2024" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">Repair Dashboard</h1>
            <p className="text-[#414844] text-lg mt-1">Track your active repair cases and verdicts.</p>
          </div>
          <Link href="/repair/new" className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-full shadow-[0px_4px_6px_rgba(27,67,50,0.15)] hover:bg-[#012d1d] transition-colors">
            + New Repair Case
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active Cases", value: "2", bg: "bg-[#1b4332]", textColor: "text-white", subColor: "text-white/80" },
            { label: "Verdicts Ready", value: "1", bg: "bg-white", textColor: "text-[#012d1d]", subColor: "text-[#414844]" },
            { label: "Avg. Repair Cost", value: "$43", bg: "bg-white", textColor: "text-[#1a1c18]", subColor: "text-[#414844]" },
            { label: "CO₂ Saved (est.)", value: "12kg", bg: "bg-[#e2e3db]", textColor: "text-[#1b4332]", subColor: "text-[#414844]" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-6 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]`}>
              <p className={`font-bold text-3xl ${stat.textColor}`}>{stat.value}</p>
              <p className={`text-sm mt-1 ${stat.subColor}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Cases List */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-[#1a1c18] text-xl px-1">Your Cases</h2>
          {cases.map((c) => (
            <Link key={c.id} href={`/repair/${c.id}`} className="bg-white border border-[#e2e3db] rounded-xl p-5 flex items-center gap-6 shadow-[0px_4px_10px_rgba(27,67,50,0.04)] hover:shadow-[0px_8px_20px_rgba(27,67,50,0.08)] transition-shadow">
              <div className="w-20 h-20 border border-[#e2e3db] rounded-lg overflow-hidden shrink-0">
                <img src={c.img} alt={c.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-[#1a1c18] text-lg">{c.title}</h3>
                  <span className="text-xs font-normal px-2 py-0.5 rounded" style={{ backgroundColor: c.statusBg, color: c.statusText }}>{c.status}</span>
                </div>
                <p className="text-[#414844] text-sm">{c.issue}</p>
                <p className="text-[#717973] text-xs">{c.date}</p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#414844] text-sm">Score</span>
                  <span className="font-semibold text-[#012d1d] text-lg">{c.score}%</span>
                </div>
                <div className="w-24 h-2 bg-[#e2e3db] rounded-full">
                  <div className="h-2 bg-[#1b4332] rounded-full" style={{ width: `${c.score}%` }} />
                </div>
                <span className="font-semibold text-[#1a1c18] text-base">{c.cost} est.</span>
              </div>
              <svg width="10" height="17" viewBox="0 0 10 17" fill="none" className="ml-2 shrink-0"><path d="M1 1l8 7.5L1 16" stroke="#c1c8c2" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
