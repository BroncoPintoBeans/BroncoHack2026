"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  DEFAULT_REWARD_USER_ID,
  type FoodRedemption,
  type RewardRedemptionResult,
  type RewardSummary,
} from "@/lib/rewards/data";

function TokenIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 9h5M9 6.5v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function RewardsPage() {
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [selectedPass, setSelectedPass] = useState<RewardRedemptionResult["pass"] | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRewards() {
      try {
        const response = await fetch(`/api/rewards?userId=${DEFAULT_REWARD_USER_ID}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load rewards");
        }

        const nextSummary = (await response.json()) as RewardSummary;
        if (!cancelled) {
          setSummary(nextSummary);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load rewards");
        }
      }
    }

    void loadRewards();

    return () => {
      cancelled = true;
    };
  }, []);

  const claimedActionIds = useMemo(() => new Set(summary?.claimedActionIds ?? []), [summary?.claimedActionIds]);
  const balance = summary?.balance ?? 0;
  const earnedThisMonth = summary?.earnedThisMonth ?? 0;
  const co2AvoidedKg = summary?.co2AvoidedKg ?? 0;
  const actionsLogged = summary?.actionsLogged ?? 0;
  const earnRules = summary?.earnRules ?? [];
  const foodRedemptions = summary?.foodRedemptions ?? [];
  const activity = summary?.activity ?? [];
  const nextRedemption = summary?.nextRedemption;

  async function claimReward(ruleId: string) {
    if (pendingAction) {
      return;
    }

    setPendingAction(ruleId);
    setError(null);

    try {
      const response = await fetch("/api/rewards/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEFAULT_REWARD_USER_ID, actionId: ruleId }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to claim reward");
      }

      setSummary(result.summary as RewardSummary);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Unable to claim reward");
    } finally {
      setPendingAction(null);
    }
  }

  async function redeemReward(reward: FoodRedemption) {
    if (pendingAction) {
      return;
    }

    setPendingAction(reward.id);
    setError(null);

    try {
      const response = await fetch("/api/rewards/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: DEFAULT_REWARD_USER_ID, redemptionId: reward.id }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to redeem reward");
      }

      setSummary(result.summary as RewardSummary);
      setSelectedPass((result as RewardRedemptionResult).pass);
    } catch (redeemError) {
      setError(redeemError instanceof Error ? redeemError.message : "Unable to redeem reward");
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
        <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
          <div className="bg-[#012d1d] rounded-lg p-6 sm:p-8 text-white flex flex-col justify-between gap-8 shadow-[0px_8px_24px_rgba(27,67,50,0.16)]">
            <div className="flex flex-col gap-3">
              <span className="text-[#ffca98] text-xs font-semibold tracking-[0.16em] uppercase">Bronco Tokens</span>
              <div>
                <h1 className="font-bold text-4xl sm:text-5xl leading-tight">Repair, trade, recycle, learn.</h1>
                <p className="text-white/75 text-base sm:text-lg mt-3 max-w-2xl">
                  Earn campus tokens for sustainable choices and redeem them for food across Cal Poly Pomona dining.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/repair/case-84920" className="inline-flex items-center justify-center gap-2 bg-[#ffca98] text-[#623f18] text-sm font-semibold px-5 py-3 rounded-lg hover:bg-[#f0bd8b] transition-colors">
                Start Repair
                <ArrowIcon />
              </Link>
              <Link href="/create-listing" className="inline-flex items-center justify-center gap-2 bg-white/10 text-white border border-white/25 text-sm font-semibold px-5 py-3 rounded-lg hover:bg-white/15 transition-colors">
                List or Trade
                <ArrowIcon />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-[#e2e3db] rounded-lg p-6 sm:p-8 flex flex-col gap-6 shadow-[0px_4px_14px_rgba(27,67,50,0.06)]">
            <div>
              <p className="text-[#414844] text-sm font-semibold tracking-[0.12em] uppercase">Available Balance</p>
              <div className="flex items-end gap-3 mt-2">
                <p className="font-bold text-[#012d1d] text-5xl leading-none">{summary ? balance.toLocaleString() : "..."}</p>
                <span className="text-[#1b4332] font-semibold text-lg pb-1">BT</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-[#e2e3db] rounded-lg p-3">
                <p className="font-bold text-[#012d1d] text-2xl">{earnedThisMonth}</p>
                <p className="text-[#717973] text-xs mt-1">Earned this month</p>
              </div>
              <div className="border border-[#e2e3db] rounded-lg p-3">
                <p className="font-bold text-[#012d1d] text-2xl">{co2AvoidedKg}kg</p>
                <p className="text-[#717973] text-xs mt-1">CO2 avoided</p>
              </div>
              <div className="border border-[#e2e3db] rounded-lg p-3">
                <p className="font-bold text-[#012d1d] text-2xl">{actionsLogged}</p>
                <p className="text-[#717973] text-xs mt-1">Actions logged</p>
              </div>
            </div>
            <div className="bg-[#f3f4ec] rounded-lg p-4 border border-[#e2e3db]">
              {error ? (
                <p className="text-[#7d562d] text-sm">{error}</p>
              ) : nextRedemption ? (
                <p className="text-[#414844] text-sm">
                  <span className="font-semibold text-[#012d1d]">{nextRedemption.tokens - balance} BT</span> until {nextRedemption.offer} at {nextRedemption.vendor}.
                </p>
              ) : (
                <p className="text-[#414844] text-sm">{summary ? "You have enough tokens for every listed food reward." : "Loading rewards..."}</p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-[#012d1d] text-2xl">Earn Tokens</h2>
              <p className="text-[#414844] text-sm mt-1">Verified sustainable actions pay out Bronco Tokens.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {earnRules.map((rule) => {
                const claimed = claimedActionIds.has(rule.id);
                const pending = pendingAction === rule.id;

                return (
                  <div key={rule.id} className="bg-white border border-[#e2e3db] rounded-lg p-5 flex flex-col gap-4 shadow-[0px_4px_12px_rgba(27,67,50,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase" style={{ backgroundColor: rule.accent }}>
                          {rule.kind.slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1a1c18] text-base leading-tight">{rule.title}</h3>
                          <p className="text-[#717973] text-xs mt-1">{rule.cadence}</p>
                        </div>
                      </div>
                      <span className="font-bold text-[#012d1d] text-lg whitespace-nowrap">+{rule.tokens} BT</span>
                    </div>
                    <p className="text-[#414844] text-sm leading-6">{rule.description}</p>
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[#274e3d] text-xs font-semibold">{rule.impact}</span>
                      <button
                        type="button"
                        onClick={() => claimReward(rule.id)}
                        disabled={claimed || pendingAction !== null || !summary}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          claimed || !summary
                            ? "bg-[#e2e3db] text-[#717973] cursor-default"
                            : "bg-[#1b4332] text-white hover:bg-[#012d1d]"
                        }`}
                      >
                        <TokenIcon className="w-4 h-4" />
                        {pending ? "Claiming" : claimed ? "Claimed" : "Claim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold text-[#012d1d] text-2xl">Campus Food Rewards</h2>
              <p className="text-[#414844] text-sm mt-1">Redeem tokens at campus dining favorites.</p>
            </div>

            {selectedPass ? (
              <div className="bg-[#ffca98] border border-[#f0bd8b] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-[#623f18] text-xs font-semibold tracking-[0.12em] uppercase">Meal Pass Ready</p>
                  <p className="font-semibold text-[#1a1c18] text-lg mt-1">{selectedPass.offer} at {selectedPass.vendor}</p>
                </div>
                <div className="bg-white/70 border border-[#623f18]/15 rounded-lg px-4 py-3 text-center">
                  <p className="font-bold text-[#012d1d] text-xl">{selectedPass.code}</p>
                  <p className="text-[#623f18] text-xs mt-1">{selectedPass.location}</p>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {foodRedemptions.map((reward) => {
                const canRedeem = balance >= reward.tokens;
                const pending = pendingAction === reward.id;

                return (
                  <div key={reward.id} className="bg-white border border-[#e2e3db] rounded-lg p-5 flex flex-col gap-4 shadow-[0px_4px_12px_rgba(27,67,50,0.04)]">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[#717973] text-xs font-semibold tracking-[0.12em] uppercase">{reward.category}</p>
                        <h3 className="font-semibold text-[#1a1c18] text-lg mt-1">{reward.vendor}</h3>
                        <p className="text-[#414844] text-sm mt-1">{reward.offer}</p>
                      </div>
                      <span className="bg-[#f3f4ec] border border-[#e2e3db] text-[#012d1d] text-sm font-bold px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {reward.tokens} BT
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[#717973] text-xs">{reward.location}</span>
                      <button
                        type="button"
                        onClick={() => redeemReward(reward)}
                        disabled={!canRedeem || pendingAction !== null || !summary}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          canRedeem && summary
                            ? "bg-[#012d1d] text-white hover:bg-[#1b4332]"
                            : "bg-[#e2e3db] text-[#717973] cursor-default"
                        }`}
                      >
                        <TokenIcon className="w-4 h-4" />
                        {pending ? "Redeeming" : canRedeem ? "Redeem" : `Need ${reward.tokens - balance}`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          <div className="bg-white border border-[#e2e3db] rounded-lg overflow-hidden shadow-[0px_4px_12px_rgba(27,67,50,0.04)]">
            <div className="px-5 py-4 border-b border-[#e2e3db] flex items-center justify-between">
              <h2 className="font-semibold text-[#012d1d] text-xl">Token Ledger</h2>
              <span className="text-[#717973] text-xs font-semibold tracking-[0.12em] uppercase">Recent</span>
            </div>
            <div>
              {activity.map((item, index) => (
                <div key={item.id} className={`px-5 py-4 flex items-center justify-between gap-4 ${index < activity.length - 1 ? "border-b border-[#e2e3db]" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.tokens >= 0 ? "bg-[#1b4332]" : "bg-[#7d562d]"}`} />
                    <div className="min-w-0">
                      <p className="text-[#1a1c18] text-sm font-semibold truncate">{item.label}</p>
                      <p className="text-[#717973] text-xs mt-0.5">{item.detail}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold text-sm ${item.tokens >= 0 ? "text-[#012d1d]" : "text-[#7d562d]"}`}>
                      {item.tokens >= 0 ? "+" : ""}{item.tokens} BT
                    </p>
                    <p className="text-[#717973] text-xs mt-0.5">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#f3f4ec] border border-[#e2e3db] rounded-lg p-5 flex flex-col gap-5">
            <div>
              <h2 className="font-semibold text-[#012d1d] text-xl">Level Progress</h2>
              <p className="text-[#414844] text-sm mt-1">Green Champion unlocks a 10% redemption discount.</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-semibold text-[#1a1c18]">Bronco Fixer</span>
                <span className="text-[#717973]">{Math.min(100, Math.round((balance / 2000) * 100))}%</span>
              </div>
              <div className="h-3 bg-[#e2e3db] rounded-lg overflow-hidden">
                <div className="h-full bg-[#1b4332]" style={{ width: `${Math.min(100, (balance / 2000) * 100)}%` }} />
              </div>
              <p className="text-[#717973] text-xs mt-2">{Math.max(0, 2000 - balance)} BT to Green Champion</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {["First Repair", "Trade Streak", "Recycler", "Repair 101"].map((badge, index) => (
                <div key={badge} className={`border rounded-lg p-3 ${index < actionsLogged ? "bg-white border-[#c1ecd4]" : "bg-[#e8e9e1] border-[#e2e3db]"}`}>
                  <p className="font-semibold text-[#1a1c18] text-sm">{badge}</p>
                  <p className="text-[#717973] text-xs mt-1">{index < actionsLogged ? "Earned" : "Locked"}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
