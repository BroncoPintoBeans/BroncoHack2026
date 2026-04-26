"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import type { MarketplaceListing } from "@/lib/db/marketplace/listings";

interface MarketplaceDetailClientProps {
  item: MarketplaceListing;
  isOwner: boolean;
}

function formatPrice(item: MarketplaceListing) {
  if (item.listingType === "free") return "Free";
  if (item.listingType === "trade") return item.tradeRequest ? `Trade for ${item.tradeRequest}` : "Trade";
  if (item.price === null || item.price === undefined) return "Price TBD";
  return `$${item.price.toLocaleString()}`;
}

function formatPosted(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function isRepairableListing(item: MarketplaceListing) {
  const condition = item.condition?.toLowerCase() ?? "";
  return (
    item.listingType === "repair" ||
    condition.includes("repair") ||
    condition.includes("parts")
  );
}

function conditionColorDetail(item: MarketplaceListing) {
  if (item.listingType === "free") return { bg: "#ffecec", text: "#b91c1c" };
  if (isRepairableListing(item)) return { bg: "#fff4e6", text: "#b65a00" };
  const cond = (item.condition || "").toLowerCase();
  if (cond.includes("like new") || cond === "new" || cond.includes("mint")) {
    return { bg: '#e6f7ea', text: '#0b6b3a' };
  }
  if (cond.includes("excellent")) return { bg: '#eaf7f0', text: '#0f8a59' };
  if (cond.includes("good")) return { bg: '#ecfdf5', text: '#0f766e' };
  if (cond.includes("fair") || cond.includes("used")) return { bg: '#fff7ed', text: '#b96b00' };
  if (cond.includes("poor") || cond.includes("damaged")) return { bg: '#fff4e6', text: '#b65a00' };
  const created = new Date(item.createdAt).getTime();
  const ageDays = Number.isFinite(created) ? Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24)) : 0;
  if (ageDays <= 7) return { bg: '#e6f7ea', text: '#0b6b3a' };
  if (ageDays <= 30) return { bg: '#f0f9f4', text: '#0f7046' };
  return { bg: '#f3f4f2', text: '#475655' };
}

function readWishlistIds() {
  try {
    const raw = localStorage.getItem("wishlist_ids");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function MarketplaceDetailClient({ item, isOwner }: MarketplaceDetailClientProps) {
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState(false);
  const images = useMemo(
    () => item.media.filter((media) => media.mediaType === "image" && media.url).map((media) => media.url!),
    [item.media]
  );
  const selectedImage = images[index] ?? item.imageUrl;

  useEffect(() => {
    if (isOwner) return;

    const timer = window.setTimeout(() => setSaved(readWishlistIds().includes(item.id)), 0);
    return () => window.clearTimeout(timer);
  }, [isOwner, item.id]);

  const toggleSaved = () => {
    try {
      const raw = localStorage.getItem("wishlist_ids");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const exists = arr.includes(item.id);
      const next = exists ? arr.filter((savedId) => savedId !== item.id) : [...arr, item.id];
      localStorage.setItem("wishlist_ids", JSON.stringify(next));
      setSaved(!exists);
    } catch {
      setSaved((current) => !current);
    }
  };

  if (isOwner) {
    return (
      <div className="min-h-screen bg-[#f9faf2]">
        <Navbar />
        <main className="max-w-[980px] mx-auto px-6 py-10">
          <BackButton fallbackHref="/marketplace" label="Back to Marketplace" className="mb-6" />

          <div className="mb-8">
            <p className="text-[#717973] text-sm font-semibold tracking-[0.6px] uppercase">Listing Manager</p>
            <h1 className="font-bold text-[#012d1d] text-[32px] tracking-tight mt-2">
              Your listing is published
            </h1>
            <p className="text-[#414844] text-base mt-2">
              This is your own post, so buyer actions are hidden. You can review the listing status or edit the details buyers see.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
            <div className="bg-[#e2e3db] rounded-xl overflow-hidden flex items-center justify-center p-4 min-h-0 self-stretch">
              {selectedImage ? (
                <img src={selectedImage} alt={item.title} className="w-full h-full object-contain" />
              ) : (
                <div className="text-[#717973] text-sm">No photo</div>
              )}
            </div>

            <section className="bg-white border border-[#e2e3db] rounded-xl p-6 flex flex-col gap-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  {item.condition ? (
                    <span className="text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded" style={{ background: conditionColorDetail(item).bg, color: conditionColorDetail(item).text }}>
                      {item.condition}
                    </span>
                  ) : null}
                  <span className="bg-[#e2e3db] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded">
                    {item.listingType}
                  </span>
                  <span className="text-[#717973] text-xs">Posted {formatPosted(item.createdAt)}</span>
                </div>
                <h2 className="font-bold text-[#1a1c18] text-[24px] tracking-tight">{item.title}</h2>
                <p className="font-semibold text-[#012d1d] text-[26px] mt-1">{formatPrice(item)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border border-[#e2e3db] rounded-lg p-3">
                  <p className="text-[#717973]">Pickup</p>
                  <p className="text-[#1a1c18] font-semibold mt-1">{item.pickupLocation || "Campus pickup"}</p>
                </div>
                <div className="border border-[#e2e3db] rounded-lg p-3">
                  <p className="text-[#717973]">Listing ID</p>
                  <p className="text-[#1a1c18] font-semibold mt-1">{item.id.slice(0, 8)}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Link
                  href={`/marketplace/${item.id}/edit`}
                  className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl text-center hover:bg-[#012d1d] transition-colors"
                >
                  Edit Listing
                </Link>
                <Link
                  href="/marketplace"
                  className="border border-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] px-6 py-4 rounded-xl text-center hover:bg-[#f3f4ec] transition-colors"
                >
                  View Marketplace
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <BackButton fallbackHref="/marketplace" label="Back to Marketplace" className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="bg-[#e2e3db] rounded-2xl overflow-hidden h-[280px] sm:h-[360px] lg:h-[420px] relative flex items-center justify-center p-4">
              {selectedImage ? (
                <img src={selectedImage} alt={item.title} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#717973] text-sm">
                  No photo
                </div>
              )}
              {images.length > 1 ? (
                <>
                  <button
                    onClick={() => setIndex((current) => (current - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-9 h-9 flex items-center justify-center"
                    aria-label="Previous image"
                  >
                    &lt;
                  </button>
                  <button
                    onClick={() => setIndex((current) => (current + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-9 h-9 flex items-center justify-center"
                    aria-label="Next image"
                  >
                    &gt;
                  </button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="grid grid-cols-4 gap-3">
                {images.map((src, idx) => (
                  <button
                    key={src}
                    onClick={() => setIndex(idx)}
                    className={`bg-[#e2e3db] rounded-lg h-20 overflow-hidden cursor-pointer transition-opacity ${
                      idx === index ? "opacity-100 ring-2 ring-[#1b4332]" : "opacity-60 hover:opacity-100"
                    }`}
                    aria-label={`Show image ${idx + 1}`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {item.condition ? (
                  <span className="text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded" style={{ background: conditionColorDetail(item).bg, color: conditionColorDetail(item).text }}>
                    {item.condition}
                  </span>
                ) : null}
                <span className="bg-[#e2e3db] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded">
                  {item.listingType}
                </span>
                <span className="text-[#717973] text-xs">Posted {formatPosted(item.createdAt)}</span>
              </div>
              <h1 className="font-bold text-[#1a1c18] text-[28px] tracking-tight">{item.title}</h1>
              <p className="font-semibold text-[#012d1d] text-[32px]">{formatPrice(item)}</p>
            </div>

            <p className="text-[#414844] text-base leading-relaxed">
              {item.description || "No description provided."}
            </p>

            <div className="flex items-center gap-2 text-[#414844] text-sm">
              <span aria-hidden="true">Location:</span>
              {item.pickupLocation || "Campus pickup"}
            </div>

            {isRepairableListing(item) ? (
              <div className="bg-[rgba(255,220,189,0.3)] border border-[#ffdcbd] rounded-xl p-4 flex flex-col gap-3">
                <p className="font-semibold text-[#1a1c18] text-sm">Repair Listing</p>
                <p className="text-[#414844] text-sm">
                  This item is marked as repairable or for parts. A repair verdict can help buyers
                  understand the likely fix before pickup.
                </p>
                <Link href="/repair/new" className="text-[#1b4332] text-xs font-semibold tracking-[0.6px] underline mt-1">
                  Get a Repair Verdict -&gt;
                </Link>
              </div>
            ) : null}

            <div className="flex items-center gap-3 p-4 bg-white border border-[#e2e3db] rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div>
                <p className="font-semibold text-[#1a1c18] text-sm">Campus seller</p>
                <p className="text-[#717973] text-xs">Listing ID {item.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href={`/messages?listing=${item.id}`}
                className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] py-4 rounded-xl text-center hover:bg-[#012d1d] transition-colors"
              >
                Message Seller
              </Link>
              <button
                onClick={toggleSaved}
                className={`border text-sm font-semibold tracking-[0.6px] py-3 rounded-xl transition-colors ${
                  saved
                    ? "bg-[#1b4332] text-white"
                    : "border border-[#e2e3db] text-[#1a1c18] hover:bg-[#f3f4ec]"
                }`}
              >
                {saved ? "Saved to Wishlist" : "Save to Wishlist"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
