import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getMarketplaceCategoryLabel, marketplaceCategoryLabels } from "@/lib/marketplace/categories";
import { createClient } from "@/lib/supabase/server";

const heroVideo = "/my-movie-1.mov";

type MarketplaceListingRow = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  listing_type: string;
  condition: string;
  category: string;
  created_at: string;
};

type MarketplaceMediaRow = {
  listing_id: string;
  storage_path: string;
  media_type: string;
};

type CaseRow = {
  id: string;
  title: string | null;
  symptoms: string | null;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
};

type MarketplaceSummaryRow = {
  category: string;
};

function getListingPrice(listing: MarketplaceListingRow) {
  if (listing.listing_type === "free") return "Free";
  if (listing.listing_type === "trade") return "Trade";
  if (listing.listing_type === "repair") return "As-is";
  if (listing.price === null) return "Contact";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(listing.price);
}

function getBadgeStyles(listingType: string) {
  const base = {
    border: "1px solid rgba(1,45,29,0.24)",
    boxShadow: "0 2px 8px rgba(1,45,29,0.18)",
  };

  if (listingType === "trade") return { ...base, backgroundColor: "#ffca98", color: "#5f3918" };
  if (listingType === "repair") return { ...base, backgroundColor: "#ffdcbd", color: "#4f310f" };
  if (listingType === "free") return { ...base, backgroundColor: "#c1ecd4", color: "#002114" };
  return { ...base, backgroundColor: "#f8f9f1", color: "#012d1d" };
}

function getPriceColor(listingType: string) {
  if (listingType === "trade") return "#7d562d";
  if (listingType === "repair") return "#623f18";
  return "#1b4332";
}

function RepairIcon({ size = 36 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none">
      <path d="M22.8 8.4a7.2 7.2 0 0 0-7.9 9.8L7.7 25.4a2.9 2.9 0 0 0 4.1 4.1l7.2-7.2a7.2 7.2 0 0 0 9.8-7.9l-4.5 4.5-4.1-1.1-1.1-4.1 4.5-4.5Z" stroke="#1b4332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 27.5h.01" stroke="#1b4332" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not specified";

  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function CategoryIcon({ category, size = 36 }: { category: string; size?: number }) {
  const normalized = category.toLowerCase();
  const stroke = "#1b4332";

  if (normalized.includes("laptop") || normalized.includes("computer")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="8" y="9" width="20" height="14" rx="2" stroke={stroke} strokeWidth="2"/><path d="M6 27h24M12 23l-2 4M24 23l2 4" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (normalized.includes("phone")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="12" y="6" width="12" height="24" rx="3" stroke={stroke} strokeWidth="2"/><path d="M16 10h4M18 26h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (normalized.includes("tablet")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="9" y="6" width="18" height="24" rx="3" stroke={stroke} strokeWidth="2"/><path d="M18 26h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (normalized.includes("monitor")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="7" y="8" width="22" height="16" rx="2" stroke={stroke} strokeWidth="2"/><path d="M18 24v5M13 29h10" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (normalized.includes("gaming")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><path d="M11 15h14a5 5 0 0 1 4.8 3.6l1.1 4A4 4 0 0 1 24.2 26l-2.1-2h-8.2l-2.1 2a4 4 0 0 1-6.7-3.4l1.1-4A5 5 0 0 1 11 15Z" stroke={stroke} strokeWidth="2" strokeLinejoin="round"/><path d="M12 20h5M14.5 17.5v5M24 19.5h.01M27 21.5h.01" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  if (normalized.includes("audio")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><path d="M10 21v-4a8 8 0 0 1 16 0v4" stroke={stroke} strokeWidth="2" strokeLinecap="round"/><rect x="6" y="19" width="6" height="9" rx="3" stroke={stroke} strokeWidth="2"/><rect x="24" y="19" width="6" height="9" rx="3" stroke={stroke} strokeWidth="2"/></svg>;
  }

  if (normalized.includes("appliance")) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="10" y="6" width="16" height="24" rx="2" stroke={stroke} strokeWidth="2"/><path d="M10 14h16M22 10h.01M14 21a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 36 36" fill="none"><rect x="8" y="8" width="8" height="8" rx="2" stroke={stroke} strokeWidth="2"/><rect x="20" y="8" width="8" height="8" rx="2" stroke={stroke} strokeWidth="2"/><rect x="8" y="20" width="8" height="8" rx="2" stroke={stroke} strokeWidth="2"/><rect x="20" y="20" width="8" height="8" rx="2" stroke={stroke} strokeWidth="2"/></svg>;
}

async function getMarketplacePreview() {
  const supabase = await createClient();
  const { data: listings, error: listingsError } = await supabase
    .from("marketplace_listings")
    .select("id,title,description,price,listing_type,condition,category,created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(2);

  if (listingsError) {
    console.error("Landing marketplace listings failed:", listingsError);
    return {
      listings: [],
      mediaByListingId: new Map<string, string>(),
      categories: marketplaceCategoryLabels.map((category) => ({ ...category, hasListings: false })),
    };
  }

  const listingRows = (listings ?? []) as MarketplaceListingRow[];
  const listingIds = listingRows.map((listing) => listing.id);
  const mediaByListingId = new Map<string, string>();

  if (listingIds.length > 0) {
    const { data: media, error: mediaError } = await supabase
      .from("marketplace_media")
      .select("listing_id,storage_path,media_type")
      .in("listing_id", listingIds)
      .eq("media_type", "image");

    if (mediaError) {
      console.error("Landing marketplace media failed:", mediaError);
    } else {
      ((media ?? []) as MarketplaceMediaRow[]).forEach((item) => {
        if (mediaByListingId.has(item.listing_id)) return;
        const { data } = supabase.storage.from("marketplace-media").getPublicUrl(item.storage_path);
        mediaByListingId.set(item.listing_id, data.publicUrl);
      });
    }
  }

  const { data: summaryRows, error: summaryError } = await supabase
    .from("marketplace_listings")
    .select("category")
    .eq("status", "active");

  if (summaryError) {
    console.error("Landing marketplace summary failed:", summaryError);
  }

  const marketplaceRows = (summaryRows ?? []) as MarketplaceSummaryRow[];
  const activeCategoryLabels = new Set(
    marketplaceRows.map((row) => getMarketplaceCategoryLabel(row.category))
  );
  const categories = marketplaceCategoryLabels.map((category) => ({
    ...category,
    hasListings: activeCategoryLabels.has(category.label),
  }));

  return { listings: listingRows, mediaByListingId, categories };
}

async function getCasePreview() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      cases: [],
    };
  }

  const { data: cases, error: casesError } = await supabase
    .from("cases")
    .select("id,title,symptoms,category,urgency,status,created_at")
    .eq("user_id", user.id)
    .not("status", "in", "(complete,failed)")
    .order("created_at", { ascending: false })
    .limit(8);

  if (casesError) {
    console.error("Landing repair cases failed:", casesError);
    return {
      cases: [],
    };
  }

  return { cases: (cases ?? []) as CaseRow[] };
}

export default async function HomePage() {
  const [
    { listings, mediaByListingId, categories },
    { cases },
  ] = await Promise.all([getMarketplacePreview(), getCasePreview()]);

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#f3f4ec] py-10">
        <div className="w-full px-10 grid grid-cols-2 gap-10 items-center">
          <div className="flex flex-col gap-4">
            <h1 className="font-bold text-[#012d1d] text-[32px] leading-tight tracking-[-0.8px]">
              Reverse Logistics for<br />Campus Reuse.
            </h1>
            <p className="text-[#2f3f38] text-lg leading-relaxed max-w-[490px]">
              We help students route broken, surplus, and unwanted items back into repair, resale, trade, or responsible recovery so usable value keeps moving through campus.
            </p>
            <div className="flex gap-4 pt-2">
              <Link
                href="/create-listing"
                className="flex items-center gap-2 bg-[#ffca98] text-[#5f3918] text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-lg hover:bg-[#f5b97a] transition-colors"
              >
                Sell or Trade an Item
              </Link>
              <Link
                href="/repair/new"
                className="flex items-center gap-2 bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3 rounded-lg hover:bg-[#012d1d] transition-colors"
              >
                {`Check if It's Worth Repairing`}
              </Link>
            </div>
            <div className="flex gap-6 pt-4">
              {["REPAIR FIRST", "RECIRCULATE VALUE", "REDUCE WASTE"].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#1b4332] opacity-60" />
                  <span className="text-[#274e3d] text-xs font-semibold tracking-[0.6px] uppercase">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)] bg-[#012d1d]">
            <video
              className="block w-full h-auto"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Student repair and campus reuse preview"
            >
              <source src={heroVideo} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Browse Categories */}
      <section className="w-full px-10 pt-12 pb-8">
        <h2 className="font-semibold text-[#012d1d] text-2xl mb-5">Browse</h2>
        <div className="grid grid-cols-8 gap-4">
          {categories.map((category) => (
            <Link
              key={category.value}
              href={`/marketplace?category=${encodeURIComponent(category.label)}`}
              className="bg-white rounded-lg min-h-25 px-3 py-4 flex flex-col items-center justify-center gap-2 shadow-[0px_4px_10px_rgba(27,67,50,0.08)] hover:shadow-[0px_4px_16px_rgba(27,67,50,0.14)] transition-shadow"
            >
              <span className="text-[#1b4332]"><CategoryIcon category={category.label} size={36} /></span>
              <span className="font-semibold text-[#1a1c18] text-xs tracking-[0.6px] text-center">{category.label}</span>
              {category.hasListings && <span className="sr-only">Has active listings</span>}
            </Link>
          ))}
        </div>
      </section>

      {/* Marketplace + Cases */}
      <section className="w-full px-10 pt-8 pb-16">
        <div className="grid grid-cols-12 gap-8 items-stretch">
          <div className="col-span-8 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#012d1d] text-2xl">Campus Marketplace</h2>
              <Link href="/marketplace" className="text-[#1b4332] text-xs font-semibold tracking-[0.6px]">View All</Link>
            </div>
            {listings.length > 0 ? (
              <div className="grid grid-cols-2 gap-6 flex-1">
                {listings.map((listing) => {
                  const imageUrl = mediaByListingId.get(listing.id);

                  return (
                    <div key={listing.id} className="bg-white rounded-xl overflow-hidden shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)] min-h-[404px] flex flex-col">
                      <div className="h-48 bg-[#e2e3db] relative overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#e8e9e1] text-[#1b4332]">
                            <CategoryIcon category={listing.category} />
                          </div>
                        )}
                        <span className="absolute top-4 left-4 backdrop-blur-sm text-xs font-bold tracking-[0.6px] px-3 py-1 rounded-full" style={getBadgeStyles(listing.listing_type)}>
                          {listing.condition}
                        </span>
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <h3 className="font-semibold text-[#1a1c18] text-xl mb-1">{listing.title}</h3>
                        <p className="text-[#414844] text-sm leading-[21px] mb-4 line-clamp-2">{listing.description}</p>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="font-semibold text-2xl" style={{ color: getPriceColor(listing.listing_type) }}>{getListingPrice(listing)}</span>
                          <Link href={`/marketplace/${listing.id}`} className="border border-[#717973] text-[#1a1c18] text-xs font-semibold tracking-[0.6px] px-4 py-2 rounded-lg hover:bg-[#f3f4ec] transition-colors">Details</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 min-h-[404px] flex flex-col items-center justify-center text-center shadow-[0px_4px_20px_0px_rgba(27,67,50,0.08)]">
                <div className="w-14 h-14 rounded-full bg-[#e8e9e1] flex items-center justify-center mb-4">
                  <CategoryIcon category="misc" />
                </div>
                <h3 className="font-semibold text-[#1a1c18] text-xl mb-2">No active listings yet</h3>
                <p className="text-[#414844] text-sm leading-[21px] max-w-[360px] mb-5">
                  Be the first to share an item with the campus marketplace.
                </p>
                <Link href="/create-listing" className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-5 py-3 rounded-lg hover:bg-[#012d1d] transition-colors">
                  Create a Listing
                </Link>
              </div>
            )}
          </div>
          <div className="col-span-4 flex flex-col gap-4 h-full">
            <h2 className="font-semibold text-[#012d1d] text-2xl">Cases</h2>
            {cases.length > 0 ? (
              <div className="bg-white rounded-xl p-4 shadow-[0px_4px_10px_rgba(27,67,50,0.08)] min-h-[404px] max-h-140 overflow-y-auto flex flex-col gap-4">
                {cases.map((repairCase) => {
                  return (
                    <Link
                      key={repairCase.id}
                      href={`/repair/${repairCase.id}`}
                      className="border border-[rgba(193,200,194,0.5)] rounded-xl p-4 flex items-center gap-4 hover:bg-[#f8f9f1] transition-colors"
                    >
                      <div className="w-20 h-20 rounded-xl bg-[#e8e9e1] shrink-0 flex items-center justify-center">
                        <RepairIcon size={36} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-semibold text-[#1a1c18] text-base truncate">{repairCase.title ?? "Repair case"}</h3>
                          <span className="shrink-0 bg-[#f3f4ec] border border-[#c1c8c2] rounded-full px-2.5 py-0.5 text-[#1b4332] text-xs font-semibold tracking-[0.4px]">
                            {formatLabel(repairCase.status)}
                          </span>
                        </div>
                        <p className="text-[#414844] text-sm leading-5 line-clamp-2">{repairCase.symptoms ?? "No symptoms added yet."}</p>
                        <p className="text-[#717973] text-[11px] font-semibold tracking-[0.4px] uppercase mt-1">
                          {formatLabel(repairCase.category)} · {formatLabel(repairCase.urgency)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-10 min-h-[404px] flex flex-col items-center justify-center text-center gap-8 shadow-[0px_4px_10px_rgba(27,67,50,0.08)]">
                <div className="w-20 h-20 rounded-full bg-[#e8e9e1] flex items-center justify-center">
                  <RepairIcon size={44} />
                </div>
                <div className="flex flex-col items-center gap-4">
                  <h3 className="font-semibold text-[#1a1c18] text-xl">No repair cases yet</h3>
                  <p className="text-[#414844] text-sm leading-[22px] max-w-[320px]">
                    Need something repaired or diagnosed? Start a case to get guided repair advice.
                  </p>
                </div>
                <Link href="/repair/new" className="bg-[#1b4332] text-white text-xs font-semibold tracking-[0.6px] px-6 py-3.5 rounded-lg hover:bg-[#012d1d] transition-colors">
                  Get Repair Advice
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#f8f9f1] border-t border-[#e5e7eb] py-12 mt-auto">
        <div className="w-full px-10 flex items-center justify-between">
          <p className="font-bold text-[#1b4332] text-sm">© 2026 Bronco Repair Desk. Built for Campus Sustainability.</p>
          <div className="flex items-center gap-4">
            {[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Campus Map", href: "/campus-map" },
              { label: "Repair Partners", href: "/repair-partners" },
            ].map((link) => (
              <Link key={link.label} href={link.href} className="text-sm text-[#6b7280] hover:text-[#1b4332] transition-colors">{link.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
