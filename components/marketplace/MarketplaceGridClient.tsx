"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import type { MarketplaceListing } from "@/lib/db/marketplace/listings";
import { marketplaceCategoryLabels } from "@/lib/marketplace/categories";

interface MarketplaceGridClientProps {
  initialItems: MarketplaceListing[];
}

const typeColors: Record<string, string> = {
  laptop: "#1b4332",
  laptops: "#1b4332",
  bike: "#d97706",
  bicycle: "#d97706",
  bicycles: "#d97706",
  "e-scooter": "#1a73e8",
  "e-scooters": "#1a73e8",
  appliance: "#b76e79",
  appliances: "#b76e79",
  books: "#374151",
  furniture: "#7d562d",
  default: "#012d1d",
};

function formatPrice(item: MarketplaceListing) {
  if (item.listingType === "free") return "Free";
  if (item.listingType === "trade") return item.tradeRequest ? `Trade for ${item.tradeRequest}` : "Trade";
  if (item.price === null || item.price === undefined) return "Price TBD";
  return `$${item.price.toLocaleString()}`;
}

function computeEcoTokens(item: MarketplaceListing) {
  const created = new Date(item.createdAt).getTime();
  const ageDays = Number.isFinite(created)
    ? Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24))
    : 0;
  const ageFactor = 1 + Math.min(365, ageDays) / 365;
  const conditionFactor =
    item.condition === "Like New" ? 1 : item.condition === "Good" ? 1.2 : 1.5;
  const base = item.price && item.price > 0 ? Math.max(1, item.price / 10) : 1;
  return Math.max(1, Math.round(base * conditionFactor * ageFactor));
}

function isRepairable(item: MarketplaceListing) {
  const condition = item.condition?.toLowerCase() ?? "";
  return (
    item.listingType === "repair" ||
    condition.includes("repair") ||
    condition.includes("parts")
  );
}

function formatCategoryKey(category: string) {
  return category.trim().toLowerCase();
}

function formatListingType(item: MarketplaceListing) {
  if (item.listingType === "sale") return "For Sale";
  if (item.listingType === "trade") return "Trade";
  if (item.listingType === "free") return "Free";
  return "Repair Needed";
}

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getCategoryColors(category: string) {
  const key = category.trim().toLowerCase();
  const color = typeColors[key] || typeColors.default;
  return { bg: hexToRgba(color, 0.12), text: color };
}

function conditionColor(item: MarketplaceListing) {
  // Priority: free -> repairable/parts -> explicit condition text -> age-based fallback
  if (item.listingType === "free") {
    return { bg: "#ffecec", text: "#b91c1c" };
  }
  if (isRepairable(item)) {
    return { bg: "#fff4e6", text: "#b65a00" };
  }

  const cond = (item.condition || "").toLowerCase();
  if (cond.includes("like new") || cond === "new" || cond.includes("mint")) {
    return { bg: '#e6f7ea', text: '#0b6b3a' }; // green
  }
  if (cond.includes("excellent")) {
    return { bg: '#eaf7f0', text: '#0f8a59' }; // light green
  }
  if (cond.includes("good")) {
    return { bg: '#ecfdf5', text: '#0f766e' }; // teal-green
  }
  if (cond.includes("fair") || cond.includes("used")) {
    return { bg: '#fff7ed', text: '#b96b00' }; // amber
  }
  if (cond.includes("poor") || cond.includes("damaged")) {
    return { bg: '#fff4e6', text: '#b65a00' }; // orange
  }

  // Age-based fallbacks
  const created = new Date(item.createdAt).getTime();
  const ageDays = Number.isFinite(created) ? Math.max(0, (Date.now() - created) / (1000 * 60 * 60 * 24)) : 0;
  if (ageDays <= 7) return { bg: '#e6f7ea', text: '#0b6b3a' };
  if (ageDays <= 30) return { bg: '#f0f9f4', text: '#0f7046' };
  if (ageDays <= 180) return { bg: '#fffaf0', text: '#7a532b' };
  return { bg: '#f3f4f2', text: '#475655' };
}

function readWishlistIds() {
  try {
    const saved = JSON.parse(localStorage.getItem("wishlist_ids") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export default function MarketplaceGridClient({ initialItems }: MarketplaceGridClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [tab, setTab] = useState("All");
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const showSavedOnly = searchParams.get("saved") === "1";

  useEffect(() => {
    const timer = window.setTimeout(() => setWishlist(readWishlistIds()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        const uid = data.user?.id ?? null;
        setUserId(uid);
        if (uid) setMyListings(initialItems.filter((it) => it.sellerId === uid));
      });
    } catch {
      const timer = window.setTimeout(() => {
        setUserId(null);
        setMyListings([]);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [initialItems]);

  useEffect(() => {
    try {
      localStorage.setItem("wishlist_ids", JSON.stringify(wishlist));
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
  }, [wishlist]);

  const types = useMemo(
    () => ["All", ...marketplaceCategoryLabels.map((category) => category.label)],
    []
  );

  const sellerMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];

    const bySeller = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        listingTitles: string[];
        listingCount: number;
      }
    >();

    for (const item of initialItems) {
      const sellerName = item.sellerName?.trim();
      if (!sellerName) continue;
      if (!sellerName.toLowerCase().includes(normalizedQuery)) continue;

      const existing =
        bySeller.get(item.sellerId) ??
        { sellerId: item.sellerId, sellerName, listingTitles: [], listingCount: 0 };
      existing.listingCount += 1;
      if (item.title) {
        existing.listingTitles.push(item.title);
      }
      bySeller.set(item.sellerId, existing);
    }

    return [...bySeller.values()]
      .map((seller) => ({
        ...seller,
        listingTitles: [...new Set(seller.listingTitles)].slice(0, 5),
      }))
      .sort((a, b) => b.listingCount - a.listingCount || a.sellerName.localeCompare(b.sellerName));
  }, [initialItems, query]);

  const filtered = useMemo(() => {
    let out = [...initialItems];

    if (showSavedOnly) {
      const savedItems = out.filter((item) => wishlist.includes(item.id));
      if (sort === "oldest") {
        savedItems.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      if (sort === "newest") {
        savedItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      if (sort === "price-asc") savedItems.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      if (sort === "price-desc") savedItems.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
      if (sort === "eco") savedItems.sort((a, b) => computeEcoTokens(b) - computeEcoTokens(a));
      return savedItems;
    }

    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery) {
      out = out.filter((item) =>
        [
          item.title,
          item.description,
          item.category,
          item.condition ?? "",
          item.pickupLocation,
          item.tradeRequest ?? "",
          item.sellerName ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedQuery))
      );
    }
    if (type !== "All") out = out.filter((item) => item.category === type);
    if (tab !== "All") {
      if (tab === "For Sale") out = out.filter((item) => item.listingType === "sale");
      if (tab === "Free") out = out.filter((item) => item.listingType === "free");
      if (tab === "Trade") out = out.filter((item) => item.listingType === "trade");
      if (tab === "Repairable") out = out.filter(isRepairable);
    }
    if (sort === "oldest") {
      out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    if (sort === "newest") {
      out.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (sort === "price-asc") out.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sort === "price-desc") out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sort === "eco") out.sort((a, b) => computeEcoTokens(b) - computeEcoTokens(a));
    return out;
  }, [initialItems, query, type, tab, sort, showSavedOnly, wishlist]);
  const hasSellerMatches = query.trim().length > 0 && sellerMatches.length > 0;
  const hasProductMatches = filtered.length > 0;

  function toggleWishlist(id: string) {
    setWishlist((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <main className="max-w-[1280px] mx-auto px-6 py-12 flex flex-col gap-8">
        <BackButton fallbackHref="/" label="Back to Home" alwaysNavigate />
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-bold text-[#012d1d] text-[32px] tracking-[-0.64px] leading-tight">
              Marketplace
            </h1>
            <p className="text-[#414844] text-lg mt-1">Give items a second life on campus.</p>
          </div>
        </div>

        <div className="flex gap-8 border-b border-[#c1c8c2] overflow-x-auto">
          {["All", "For Sale", "Free", "Trade", "Repairable"].map((itemTab) => (
            <button
              key={itemTab}
              onClick={() => setTab(itemTab)}
              className={`pb-3 text-xs font-semibold tracking-[0.6px] transition-colors whitespace-nowrap ${
                tab === itemTab ? "text-[#012d1d] border-b-2 border-[#012d1d]" : "text-[#414844]"
              }`}
            >
              {itemTab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-9 flex flex-col gap-6">
            {!showSavedOnly ? (
              <div className="flex flex-wrap items-center gap-4">
                <input
                  aria-label="Search"
                  className="bg-white border border-[#c1c8c2] rounded-full px-4 py-2.5 text-sm text-[#1a1c18] w-full sm:w-64 outline-none focus:border-[#1b4332]"
                  placeholder="Search for listings or users"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  className="border border-[#c1c8c2] rounded-full px-4 py-2 text-xs font-semibold text-[#414844] tracking-[0.6px] bg-white"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                >
                  {types.map((itemType) => (
                    <option key={itemType} value={itemType}>
                      {itemType === "All" ? "Category" : itemType}
                    </option>
                  ))}
                </select>
                <select
                  className="border border-[#c1c8c2] rounded-full px-4 py-2 text-xs font-semibold text-[#414844] tracking-[0.6px] bg-white"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="eco">Eco Tokens</option>
                </select>
                <button
                  onClick={() => setTab("Repairable")}
                  className={`border rounded-full px-4 py-2 text-xs font-semibold tracking-[0.6px] ${
                    tab === "Repairable"
                      ? "bg-[#1b4332] border-[#1b4332] text-white"
                      : "bg-[#e8e9e1] border-[#c1c8c2] text-[#1a1c18]"
                  }`}
                >
                  Repair Needed
                </button>
              </div>
            ) : null}

            {!hasSellerMatches && !hasProductMatches ? (
              <div className="bg-white border border-[#e2e3db] rounded-xl p-8 text-[#414844]">
                {showSavedOnly
                  ? "No bookmarked items."
                  : "No sellers or marketplace listings match that search."}
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {!showSavedOnly && hasSellerMatches ? (
                  <section className="bg-white border border-[#e2e3db] rounded-xl p-5">
                    <p className="text-xs font-semibold tracking-[0.6px] text-[#717973] uppercase">
                      Sellers
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {sellerMatches.map((seller) => (
                        <Link
                          key={seller.sellerId}
                          href={`/sellers/${seller.sellerId}`}
                          className="rounded-xl border border-[#e2e3db] bg-[#f9faf2] p-4 hover:bg-[#f3f4ec] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-[#1b4332] text-white flex items-center justify-center font-semibold">
                              {seller.sellerName[0]?.toUpperCase() ?? "S"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[#1a1c18] text-sm whitespace-normal break-words">
                                {seller.sellerName}
                              </p>
                              <p className="mt-1 text-xs text-[#717973]">
                                {seller.listingCount}{" "}
                                {seller.listingCount === 1 ? "listing" : "listings"}
                              </p>
                              {seller.listingTitles.length > 0 ? (
                                <div className="mt-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#717973]">
                                    Listings
                                  </p>
                                  <p className="mt-1 text-xs text-[#414844]">
                                    {seller.listingTitles.join(" • ")}
                                    {seller.listingCount > seller.listingTitles.length ? " • …" : ""}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : null}

                {hasProductMatches ? (
                  <section className="flex flex-col gap-4">
                    <p className="text-xs font-semibold tracking-[0.6px] text-[#717973] uppercase">
                      Products
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((item) => {
                    const categoryKey = formatCategoryKey(item.category);
                    const saved = wishlist.includes(item.id);

                    return (
                      <div key={item.id} className="relative">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/marketplace/${item.id}`)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") router.push(`/marketplace/${item.id}`);
                          }}
                          className="bg-white border border-[rgba(193,200,194,0.3)] rounded-xl overflow-hidden shadow-[0px_4px_12px_0px_rgba(27,67,50,0.04)] hover:shadow-[0px_8px_24px_0px_rgba(27,67,50,0.1)] transition-shadow flex flex-col cursor-pointer min-h-full"
                        >
                          <div className="h-48 bg-[#e2e3db] relative overflow-hidden">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#717973] text-sm">
                                No photo
                              </div>
                            )}
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                toggleWishlist(item.id);
                              }}
                              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
                              title={saved ? "Saved" : "Save"}
                              className={`absolute top-3 right-3 rounded-full p-2 transition-colors ${
                                saved ? "bg-[#1b4332] text-white border-[#1b4332]" : "bg-white text-[#1b4332] border border-[#c1c8c2]"
                              }`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 2h12v19l-6-4-6 4V2z" fill="currentColor" />
                              </svg>
                            </button>
                            <span
                              className="absolute top-3 right-14 text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded"
                              style={{ background: conditionColor(item).bg, color: conditionColor(item).text }}
                            >
                              {item.condition ?? formatListingType(item)}
                            </span>
                          </div>
                            <div className="p-4 flex flex-col flex-1">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-[#1a1c18] text-xl leading-7" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item.title}
                                </h3>
                                {item.listingType === 'trade' ? (
                                  <div className="mt-2 inline-block border border-[#e2e3db] text-[#414844] text-sm px-3 py-1 rounded">
                                    {item.tradeRequest ? `Trade for ${item.tradeRequest}` : 'Trade'}
                                  </div>
                                ) : null}
                              </div>
                              {item.listingType === 'trade' ? null : (
                                <span
                                  className="font-semibold text-2xl leading-8 whitespace-nowrap"
                                  style={{ color: typeColors[categoryKey] || typeColors.default }}
                                >
                                  {formatPrice(item)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded" style={{ background: getCategoryColors(item.category).bg, color: getCategoryColors(item.category).text }}>
                                {item.category}
                              </span>
                              <span className="bg-[#e8e9e1] text-[#414844] text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded">
                                {formatListingType(item)}
                              </span>
                            </div>
                            <p
                              className="text-[#414844] text-sm mb-4 flex-1"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {item.description || "No description provided."}
                            </p>
                            <div className="border-t border-[rgba(193,200,194,0.5)] pt-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-2 text-[#414844] text-xs">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" fill="#475655" />
                                  </svg>
                                  <span className="font-semibold">{item.pickupLocation || "Campus pickup"}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <EcoSprout item={item} />
                                <span className="font-semibold text-[#012d1d] text-xs tracking-[0.6px]">
                                  {computeEcoTokens(item)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                    </div>
                  </section>
                ) : (
                  <div className="bg-white border border-[#e2e3db] rounded-xl p-6 text-[#414844] text-sm">
                    No products match that search, but seller matches are shown above.
                  </div>
                )}
              </div>
            )}

          </section>

          {!showSavedOnly ? (
            <aside className="lg:col-span-3">
              <div className="bg-[#f3f4ec] border border-[rgba(193,200,194,0.2)] rounded-xl p-6 flex flex-col gap-6 shadow-[0px_1px_1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[#1a1c18] text-xl">My Activity</h2>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold text-[#414844] text-xs tracking-[0.6px]">
                      Active Listings
                    </span>
                    <span className="font-semibold text-[#012d1d] text-2xl">
                      {myListings.length}
                    </span>
                  </div>
                  <div className="bg-[#e2e3db] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1b4332] h-2 rounded-full"
                      style={{ width: `${Math.min(100, myListings.length * 20)}%` }}
                    />
                  </div>
                </div>
                <div className="border-t border-[rgba(193,200,194,0.3)] pt-4 flex flex-col gap-4">
                  <span className="font-semibold text-[#414844] text-xs tracking-[0.6px]">
                    Recent Listings
                  </span>
                  {myListings.slice(0, 2).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => router.push(`/marketplace/${item.id}`)}
                      className="bg-white border border-[rgba(193,200,194,0.3)] rounded-lg p-3 flex items-center gap-3 text-left"
                    >
                      <div className="w-12 h-12 bg-[#e2e3db] rounded overflow-hidden shrink-0">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1a1c18] text-sm leading-5 truncate">
                          {item.title}
                        </p>
                        <p className="font-bold text-[#414844] text-[10px] tracking-[1px]">
                          {formatPrice(item)}
                        </p>
                      </div>
                    </button>
                  ))}
                  {myListings.length === 0 ? (
                    <div className="bg-white border border-[rgba(193,200,194,0.3)] rounded-lg p-3 text-[#717973] text-sm">
                      Your first listing will show up here.
                    </div>
                  ) : null}
                </div>
                <Link
                  href="/create-listing"
                  className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-4 py-3 rounded-lg text-center hover:bg-[#012d1d] transition-colors"
                >
                  + Make a Listing
                </Link>
              </div>
            </aside>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function EcoSprout({ item }: { item: MarketplaceListing }) {
  const tokens = computeEcoTokens(item);
  // Determine emoji and size based on tokens
  let emoji = "🌱";
  let size = 16;
  if (tokens <= 2) {
    emoji = "🌱"; size = 16;
  } else if (tokens <= 5) {
    emoji = "🌿"; size = 20;
  } else if (tokens <= 10) {
    emoji = "🪴"; size = 22;
  } else {
    emoji = "🌳"; size = 26;
  }

  return (
    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: size, lineHeight: 1 }}>{emoji}</span>
    </span>
  );
}
