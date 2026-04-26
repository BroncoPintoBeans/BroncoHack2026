import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { getMarketplaceCategoryLabel } from "@/lib/marketplace/categories";
import { createClient } from "@/lib/supabase/server";

type ListingRow = {
  id: string;
  title: string;
  description: string;
  price: number | null;
  listing_type: string;
  condition: string;
  category: string;
  trade_request: string | null;
  pickup_location: string;
  seller_id: string;
  created_at: string;
};

type MediaRow = {
  storage_path: string;
  media_type: string;
};

function getListingPrice(listing: ListingRow) {
  if (listing.listing_type === "free") return "Free";
  if (listing.listing_type === "trade") return "Trade";
  if (listing.listing_type === "repair") return "As-is";
  if (listing.price === null) return "Contact Seller";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(listing.price);
}

function getListingTypeLabel(type: string) {
  if (type === "sale") return "For Sale";
  if (type === "trade") return "Trade";
  if (type === "free") return "Free";
  if (type === "repair") return "Needs Repair";

  return "Listing";
}

function formatPostedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function ImagePlaceholder({ title }: { title: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#e2e3db] text-[#1b4332]">
      <div className="flex flex-col items-center gap-3">
        <svg aria-hidden="true" width="54" height="54" viewBox="0 0 54 54" fill="none">
          <rect x="10" y="12" width="34" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <path d="M15 35l9-9 7 7 4-4 4 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="36" cy="21" r="3" stroke="currentColor" strokeWidth="2.5" />
        </svg>
        <span className="font-semibold text-sm tracking-[0.6px]">{title}</span>
      </div>
    </div>
  );
}

async function getListing(id: string) {
  const supabase = await createClient();
  const { data: listing, error: listingError } = await supabase
    .from("marketplace_listings")
    .select("id,title,description,price,listing_type,condition,category,trade_request,pickup_location,seller_id,created_at")
    .eq("id", id)
    .eq("status", "active")
    .single();

  if (listingError || !listing) {
    return null;
  }

  const { data: media, error: mediaError } = await supabase
    .from("marketplace_media")
    .select("storage_path,media_type")
    .eq("listing_id", id)
    .eq("media_type", "image");

  if (mediaError) {
    console.error("Listing detail media failed:", mediaError);
  }

  const imageUrls = ((media ?? []) as MediaRow[]).map((item) => {
    const { data } = supabase.storage.from("marketplace-media").getPublicUrl(item.storage_path);
    return data.publicUrl;
  });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", (listing as ListingRow).seller_id)
    .maybeSingle();

  return {
    listing: listing as ListingRow,
    imageUrls,
    sellerName: typeof profile?.display_name === "string" && profile.display_name.trim()
      ? profile.display_name.trim()
      : "Campus Seller",
  };
}

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getListing(id);

  if (!result) {
    notFound();
  }

  const { listing, imageUrls, sellerName } = result;
  const primaryImage = imageUrls[0];
  const categoryLabel = getMarketplaceCategoryLabel(listing.category);

  return (
    <div className="min-h-screen bg-[#f9faf2]">
      <Navbar />
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <Link href="/marketplace" className="flex items-center gap-2 text-[#1b4332] text-sm font-semibold mb-6 hover:opacity-80">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="#1b4332" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Marketplace
        </Link>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-7 flex flex-col gap-4">
            <div className="bg-[#e2e3db] rounded-2xl overflow-hidden h-[400px]">
              {primaryImage ? (
                <img src={primaryImage} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <ImagePlaceholder title={listing.title} />
              )}
            </div>
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {imageUrls.slice(0, 4).map((imageUrl) => (
                  <div key={imageUrl} className="bg-[#e2e3db] rounded-lg h-20 overflow-hidden opacity-70 cursor-pointer hover:opacity-100 transition-opacity">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-5 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#ffca98] text-[#7a532b] text-xs font-semibold tracking-[0.6px] px-2 py-1 rounded">{listing.condition}</span>
                <span className="text-[#717973] text-xs">Posted {formatPostedDate(listing.created_at)}</span>
              </div>
              <h1 className="font-bold text-[#1a1c18] text-[28px] tracking-tight">{listing.title}</h1>
              <p className="font-semibold text-[#012d1d] text-[32px]">{getListingPrice(listing)}</p>
            </div>

            <p className="text-[#414844] text-base leading-relaxed">{listing.description}</p>

            <div className="flex items-center gap-2 text-[#414844] text-sm">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none"><path d="M7 1C3.686 1 1 3.686 1 7c0 4.418 6 10 6 10s6-5.582 6-10c0-3.314-2.686-6-6-6z" stroke="#414844" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" stroke="#414844" strokeWidth="1.2"/></svg>
              {listing.pickup_location}
            </div>

            <div className="bg-[rgba(255,220,189,0.3)] border border-[#ffdcbd] rounded-xl p-4 flex flex-col gap-3">
              <p className="font-semibold text-[#1a1c18] text-sm">Listing Details</p>
              {[
                `Category: ${categoryLabel}`,
                `Listing type: ${getListingTypeLabel(listing.listing_type)}`,
                `Condition: ${listing.condition}`,
                listing.trade_request ? `Looking to trade for: ${listing.trade_request}` : "",
              ].filter(Boolean).map((detail) => (
                <div key={detail} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" stroke="#623f18" strokeWidth="1"/></svg>
                  <span className="text-[#414844] text-sm">{detail}</span>
                </div>
              ))}
              {listing.listing_type === "repair" && (
                <Link href={`/repair/${listing.id}`} className="text-[#1b4332] text-xs font-semibold tracking-[0.6px] underline mt-1">Get a Repair Verdict →</Link>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-white border border-[#e2e3db] rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#1b4332] flex items-center justify-center text-white font-semibold">
                {sellerName[0]}
              </div>
              <div>
                <p className="font-semibold text-[#1a1c18] text-sm">{sellerName}</p>
                <p className="text-[#717973] text-xs">Campus marketplace seller</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href="/messages" className="bg-[#1b4332] text-white text-sm font-semibold tracking-[0.6px] py-4 rounded-xl text-center hover:bg-[#012d1d] transition-colors">
                Message Seller
              </Link>
              <button className="border border-[#e2e3db] text-[#1a1c18] text-sm font-semibold tracking-[0.6px] py-3 rounded-xl hover:bg-[#f3f4ec] transition-colors">
                Save to Wishlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
