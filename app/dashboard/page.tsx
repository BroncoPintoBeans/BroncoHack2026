import Link from "next/link";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import { listRepairDashboardCases, type RepairDashboardCase } from "@/lib/db/repair/cases";
import { getUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "#e2e3db", text: "#414844" },
  awaiting_user: { label: "Needs Info", bg: "#ffdcbd", text: "#623f18" },
  running: { label: "Analyzing", bg: "#ffdcbd", text: "#623f18" },
  complete: { label: "Verdict Ready", bg: "#c1ecd4", text: "#274e3d" },
  failed: { label: "Failed", bg: "#fee2e2", text: "#991b1b" },
};

function titleForRepairCase(item: RepairDashboardCase) {
  if (item.title?.trim()) return item.title;
  return `${formatCategory(item.category)} repair case`;
}

function formatCategory(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(cents: number | null) {
  if (cents === null) return null;
  return `$${Math.round(cents / 100).toLocaleString()}`;
}

function repairCostLabel(item: RepairDashboardCase) {
  const low = item.verdict?.repairLowCents ?? null;
  const high = item.verdict?.repairHighCents ?? null;

  if (low !== null && high !== null) return `${formatMoney(low)}-${formatMoney(high)} est.`;
  if (low !== null) return `${formatMoney(low)}+ est.`;
  if (item.quotedPriceCents !== null) return `${formatMoney(item.quotedPriceCents)} quoted`;
  return "No estimate";
}

function scorePercent(item: RepairDashboardCase) {
  if (item.verdict?.rrrScore === null || item.verdict?.rrrScore === undefined) return null;
  return Math.round(item.verdict.rrrScore * 100);
}

function estimateCents(item: RepairDashboardCase) {
  const low = item.verdict?.repairLowCents ?? null;
  const high = item.verdict?.repairHighCents ?? null;
  if (low !== null && high !== null) return Math.round((low + high) / 2);
  return low ?? item.quotedPriceCents;
}

function statusForRepairCase(item: RepairDashboardCase) {
  if (item.verdict && item.status === "complete") return statusStyles.complete;
  return statusStyles[item.status] ?? {
    label: formatCategory(item.status),
    bg: "#e2e3db",
    text: "#414844",
  };
}

function statsForCases(cases: RepairDashboardCase[]) {
  const activeCount = cases.filter((item) => !["complete", "failed"].includes(item.status)).length;
  const verdictCount = cases.filter((item) => item.verdict || item.status === "complete").length;
  const estimates = cases.map(estimateCents).filter((value): value is number => value !== null);
  const averageEstimate = estimates.length
    ? Math.round(estimates.reduce((sum, value) => sum + value, 0) / estimates.length)
    : null;
  const co2SavedKg = verdictCount * 4;

  return [
    { label: "Active Cases", value: String(activeCount), bg: "bg-[#1b4332]", textColor: "text-white", subColor: "text-white/80" },
    { label: "Verdicts Ready", value: String(verdictCount), bg: "bg-white", textColor: "text-[#012d1d]", subColor: "text-[#414844]" },
    { label: "Avg. Repair Cost", value: formatMoney(averageEstimate) ?? "$0", bg: "bg-white", textColor: "text-[#1a1c18]", subColor: "text-[#414844]" },
    { label: "CO2 Saved (est.)", value: `${co2SavedKg}kg`, bg: "bg-[#e2e3db]", textColor: "text-[#1b4332]", subColor: "text-[#414844]" },
  ];
}

export default async function DashboardPage() {
  const user = await getUser();
  const cases = user ? await listRepairDashboardCases() : [];
  const stats = statsForCases(cases);

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-8">
        <BackButton fallbackHref="/" label="Back to Home" alwaysNavigate />
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
          {stats.map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-6 shadow-[0px_4px_10px_rgba(27,67,50,0.06)]`}>
              <p className={`font-bold text-3xl ${stat.textColor}`}>{stat.value}</p>
              <p className={`text-sm mt-1 ${stat.subColor}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Cases List */}
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-[#1a1c18] text-xl px-1">Your Cases</h2>
          {!user ? (
            <div className="bg-white border border-[#e2e3db] rounded-xl p-8 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
              <h3 className="font-semibold text-[#1a1c18] text-lg">Sign in to see your repair cases</h3>
              <p className="text-[#414844] text-sm mt-2">Your repair dashboard is tied to the cases owned by your Supabase account.</p>
              <Link href="/" className="inline-flex mt-5 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-full hover:bg-[#012d1d] transition-colors">
                Sign in
              </Link>
            </div>
          ) : cases.length === 0 ? (
            <div className="bg-white border border-[#e2e3db] rounded-xl p-8 shadow-[0px_4px_10px_rgba(27,67,50,0.04)]">
              <h3 className="font-semibold text-[#1a1c18] text-lg">No repair cases found</h3>
              <p className="text-[#414844] text-sm mt-2">
                The dashboard is connected to Supabase, but your `cases` table is not returning any repair cases for this account yet.
              </p>
            </div>
          ) : cases.map((repairCase) => {
            const status = statusForRepairCase(repairCase);
            const score = scorePercent(repairCase);

            return (
              <Link key={repairCase.id} href={`/repair/${repairCase.id}`} className="bg-white border border-[#e2e3db] rounded-xl p-5 flex items-center gap-6 shadow-[0px_4px_10px_rgba(27,67,50,0.04)] hover:shadow-[0px_8px_20px_rgba(27,67,50,0.08)] transition-shadow">
                <div className="w-20 h-20 border border-[#e2e3db] rounded-lg overflow-hidden shrink-0 bg-[#e8e9e1] flex items-center justify-center">
                  {repairCase.imageUrl ? (
                    <img src={repairCase.imageUrl} alt={titleForRepairCase(repairCase)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#1b4332] text-xs font-bold tracking-[0.6px] uppercase text-center px-2">
                      {formatCategory(repairCase.category)}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-[#1a1c18] text-lg">{titleForRepairCase(repairCase)}</h3>
                    <span className="text-xs font-normal px-2 py-0.5 rounded" style={{ backgroundColor: status.bg, color: status.text }}>{status.label}</span>
                  </div>
                  <p className="text-[#414844] text-sm">{repairCase.symptoms}</p>
                  <p className="text-[#717973] text-xs">{formatDate(repairCase.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#414844] text-sm">Score</span>
                    <span className="font-semibold text-[#012d1d] text-lg">{score === null ? "Pending" : `${score}%`}</span>
                  </div>
                  <div className="w-24 h-2 bg-[#e2e3db] rounded-full">
                    <div className="h-2 bg-[#1b4332] rounded-full" style={{ width: `${score ?? 0}%` }} />
                  </div>
                  <span className="font-semibold text-[#1a1c18] text-base">{repairCostLabel(repairCase)}</span>
                </div>
                <svg width="10" height="17" viewBox="0 0 10 17" fill="none" className="ml-2 shrink-0"><path d="M1 1l8 7.5L1 16" stroke="#c1c8c2" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
