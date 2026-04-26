"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { DEFAULT_REWARD_USER_ID, EARN_RULES } from "@/lib/rewards/data";

const categories = ["Laptops", "Bicycles", "E-Scooters", "Appliances", "Furniture", "Books", "Clothing", "Other"];
const conditions = ["Like New", "Good", "Used - Fair", "For Parts"];
const listingTypes = [
  { value: "sale", label: "For Sale", desc: "Set a price and sell", color: "#1b4332" },
  { value: "trade", label: "Trade", desc: "Swap for something else", color: "#7d562d" },
  { value: "free", label: "Free", desc: "Give it away", color: "#012d1d" },
  { value: "repair", label: "Needs Repair", desc: "Sell as-is for parts", color: "#623f18" },
];
const listingReward = EARN_RULES.find((rule) => rule.id === "listing-published") ?? EARN_RULES[0];

export default function CreateListingPage() {
  const [step, setStep] = useState(1);
  const [type, setType] = useState("sale");
  const [condition, setCondition] = useState("Good");
  const [published, setPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    if (published || isPublishing) {
      return;
    }

    setIsPublishing(true);
    setPublishError(null);

    try {
      const response = await fetch("/api/rewards/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: DEFAULT_REWARD_USER_ID,
          actionId: listingReward.id,
          sourceType: "marketplace_listing",
          sourceId: "draft-listing",
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Listing reward could not be awarded");
      }

      setPublished(true);
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : "Listing reward could not be awarded");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[860px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px]">Create a Listing</h1>
          <p className="text-[#414844] text-lg mt-1">Help an item find its next home.</p>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-2 mb-10">
          {["Photos", "Details", "Pricing", "Review"].map((label, i) => {
            const s = i + 1;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${s <= step ? "bg-[#1b4332] text-white" : "bg-[#e2e3db] text-[#717973]"}`}>{s}</div>
                  <span className={`text-sm font-semibold ${s <= step ? "text-[#1b4332]" : "text-[#717973]"}`}>{label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 ${s < step ? "bg-[#1b4332]" : "bg-[#e2e3db]"}`} />}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="bg-white border border-[#e2e3db] rounded-2xl shadow-[0px_4px_20px_rgba(27,67,50,0.06)] overflow-hidden">
          {step === 1 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-xl">Add Photos</h2>
              <div className="border-2 border-dashed border-[#c1c8c2] rounded-xl p-12 flex flex-col items-center gap-4 cursor-pointer hover:border-[#1b4332] transition-colors">
                <div className="w-16 h-16 bg-[#e8e9e1] rounded-full flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="3" y="7" width="22" height="16" rx="3" stroke="#717973" strokeWidth="1.5"/><circle cx="14" cy="15" r="4" stroke="#717973" strokeWidth="1.5"/><path d="M10 7l1.5-3h5L18 7" stroke="#717973" strokeWidth="1.5"/></svg>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-[#1a1c18] text-base">Drop photos here or click to upload</p>
                  <p className="text-[#717973] text-sm mt-1">JPG, PNG up to 10MB. Up to 8 photos.</p>
                </div>
                <button className="bg-[#e8e9e1] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-5 py-2.5 rounded-lg">Choose Files</button>
              </div>
              <p className="text-[#414844] text-sm">Tip: Clear, well-lit photos get 3× more views. Show any damage honestly.</p>
            </div>
          )}

          {step === 2 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-xl">Item Details</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Title</label>
                  <input className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" placeholder="e.g. Trek FX2 Disc Hybrid Bike" />
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button key={cat} className="border border-[#c1c8c2] rounded-lg py-2 text-xs font-semibold text-[#414844] tracking-[0.6px] hover:border-[#1b4332] hover:text-[#1b4332] transition-colors">{cat}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Condition</label>
                  <div className="flex gap-2">
                    {conditions.map((c) => (
                      <button key={c} onClick={() => setCondition(c)} className={`flex-1 border rounded-lg py-2 text-xs font-semibold tracking-[0.6px] transition-colors ${condition === c ? "border-[#1b4332] bg-[#1b4332] text-white" : "border-[#c1c8c2] text-[#414844]"}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Description</label>
                  <textarea className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#414844] text-base outline-none focus:border-[#1b4332] h-28 resize-none" placeholder="Describe the item's condition, any defects, and why you're selling..." />
                </div>
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Pickup Location</label>
                  <input className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" placeholder="e.g. West Village, Engineering Building lobby..." />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-xl">Pricing &amp; Type</h2>
              <div>
                <label className="block text-[#1a1c18] text-sm font-semibold mb-3">Listing Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {listingTypes.map((t) => (
                    <button key={t.value} onClick={() => setType(t.value)} className={`border-2 rounded-xl p-4 text-left transition-all ${type === t.value ? "border-[#1b4332] bg-[rgba(27,67,50,0.04)]" : "border-[#e2e3db]"}`}>
                      <p className="font-semibold text-[#1a1c18] text-base">{t.label}</p>
                      <p className="text-[#717973] text-sm mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              {type === "sale" && (
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#414844] text-base">$</span>
                    <input type="number" className="w-full border border-[#c1c8c2] rounded-lg pl-8 pr-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" placeholder="0" />
                  </div>
                </div>
              )}
              {type === "trade" && (
                <div>
                  <label className="block text-[#1a1c18] text-sm font-semibold mb-1.5">What are you looking to trade for?</label>
                  <input className="w-full border border-[#c1c8c2] rounded-lg px-4 py-3 text-[#1a1c18] text-base outline-none focus:border-[#1b4332]" placeholder="e.g. Desk lamp, monitor stand..." />
                </div>
              )}
              <div className="bg-[rgba(193,236,212,0.2)] border border-[#c1ecd4] rounded-xl p-4 flex items-start gap-3">
                <svg className="shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" stroke="#274e3d" strokeWidth="1.5"/><path d="M10 6v4.5M10 13h.01" stroke="#274e3d" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <p className="text-[#274e3d] text-sm leading-relaxed">If your item is damaged, consider using the <Link href="/repair/case-84920" className="font-semibold underline">Repair Verdict</Link> tool first. Items with a repair verdict attached get 2× more interest!</p>
              </div>
              <div className="bg-[#f3f4ec] border border-[#e2e3db] rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[#414844] text-xs font-semibold tracking-[0.6px] uppercase">Token Reward</p>
                  <p className="text-[#1a1c18] text-sm mt-1">Publishing this listing earns Bronco Tokens for starting a reuse path.</p>
                </div>
                <span className="bg-[#1b4332] text-white text-sm font-bold px-3 py-2 rounded-lg whitespace-nowrap">+{listingReward.tokens} BT</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="p-8 flex flex-col gap-6">
              <h2 className="font-semibold text-[#1a1c18] text-xl">Review &amp; Publish</h2>
              <div className="bg-[#f3f4ec] rounded-xl p-5 flex flex-col gap-3">
                <div className="w-full h-48 bg-[#e2e3db] rounded-lg flex items-center justify-center">
                  <span className="text-[#717973] text-sm">No photo added</span>
                </div>
                <h3 className="font-semibold text-[#1a1c18] text-xl">Your Item Title</h3>
                <div className="flex gap-2">
                  <span className="bg-[#ffca98] text-[#7a532b] text-xs font-semibold tracking-[0.6px] px-2 py-0.5 rounded">Repairable</span>
                  <span className="bg-[#e2e3db] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-2 py-0.5 rounded">Good</span>
                </div>
                <p className="text-[#414844] text-sm">Your item description will appear here once submitted.</p>
                <div className="flex items-center justify-between pt-2 border-t border-[#e2e3db]">
                  <span className="font-semibold text-[#012d1d] text-2xl">$0</span>
                  <span className="text-[#717973] text-xs">📍 Pickup location</span>
                </div>
              </div>
              {published && (
                <div className="bg-[#c1ecd4] border border-[#86af99] rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[#012d1d] text-sm">Listing submitted</p>
                    <p className="text-[#274e3d] text-sm mt-0.5">+{listingReward.tokens} Bronco Tokens added to your rewards ledger.</p>
                  </div>
                  <Link href="/rewards" className="text-[#012d1d] text-xs font-semibold tracking-[0.6px] underline whitespace-nowrap">
                    View Rewards
                  </Link>
                </div>
              )}
              {publishError && (
                <div className="bg-[#ffdcbd] border border-[#f0bd8b] rounded-xl p-4">
                  <p className="text-[#623f18] text-sm">{publishError}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handlePublish}
                disabled={published || isPublishing}
                className={`text-sm font-semibold tracking-[0.6px] py-4 rounded-xl transition-colors ${
                  published
                    ? "bg-[#e2e3db] text-[#717973] cursor-default"
                    : "bg-[#1b4332] text-white hover:bg-[#012d1d]"
                }`}
              >
                {published ? "Published" : isPublishing ? "Publishing..." : `Publish Listing +${listingReward.tokens} BT`}
              </button>
            </div>
          )}

          {/* Step Controls */}
          <div className="px-8 py-5 border-t border-[#e2e3db] flex justify-between">
            <button onClick={() => setStep(Math.max(1, step - 1))} className={`border border-[#e2e3db] text-[#414844] text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-[#f3f4ec] transition-colors ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}>
              Back
            </button>
            {step < 4 ? (
              <button onClick={() => setStep(step + 1)} className="bg-[#1b4332] text-white text-sm font-semibold px-8 py-2.5 rounded-lg hover:bg-[#012d1d] transition-colors">
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
